import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, ArrowDown, ArrowUp, Building2, CheckCircle2, LoaderCircle, Pencil, Send, Sparkles, Star, Trash2, UploadCloud, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { StatusPanel } from '../../components/common/StatusPanel'
import { propertyKeys } from '../../hooks/useProperties'
import { ApiError } from '../../lib/api'
import { formatCompactPrice } from '../../lib/format'
import { aiService, DESCRIPTION_TONES, type DescriptionTone } from '../../services/ai.service'
import { propertiesService } from '../../services/properties.service'
import {
  FURNISHING_STATUSES,
  PROPERTY_AMENITIES,
  PROPERTY_PURPOSES,
  PROPERTY_TYPES,
  type Property,
  type PropertyAmenity,
} from '../../types/property'
import '../dashboard/dashboard.css'

const propertySchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(20).max(5000),
  propertyType: z.enum(PROPERTY_TYPES),
  purpose: z.enum(PROPERTY_PURPOSES),
  price: z.coerce.number().positive(),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  areaSqFt: z.coerce.number().int().min(100),
  amenities: z.array(z.enum(PROPERTY_AMENITIES)),
  furnishing: z.enum(FURNISHING_STATUSES),
  parking: z.boolean(),
  address: z.string().trim().min(5),
  locality: z.string().trim().min(2),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  country: z.string().trim().min(2),
  postalCode: z.string().trim().min(3),
})

type PropertyFormValues = z.output<typeof propertySchema>
type PropertyFormInput = z.input<typeof propertySchema>

function PropertyEditor({ property, onClose }: { property: Property; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [tone, setTone] = useState<DescriptionTone>('PROFESSIONAL')
  const detail = useQuery({
    queryKey: propertyKeys.detail(property.id),
    queryFn: ({ signal }) => propertiesService.getById(property.id, signal),
    initialData: property,
    retry: false,
  })
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<PropertyFormInput, unknown, PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: property.title,
      description: property.description,
      propertyType: property.propertyType,
      purpose: property.purpose,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqFt: property.areaSqFt,
      amenities: property.amenities.filter((amenity): amenity is PropertyAmenity => (PROPERTY_AMENITIES as readonly string[]).includes(amenity)),
      furnishing: property.furnishing,
      parking: property.parking,
      address: property.address,
      locality: property.locality,
      city: property.city,
      state: property.state,
      country: property.country,
      postalCode: property.postalCode,
    },
  })
  const images = [...(detail.data?.images ?? [])].sort((a, b) => a.position - b.position)

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(property.id) }),
      queryClient.invalidateQueries({ queryKey: ['properties'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'agent'] }),
    ])
  }

  const update = useMutation({
    mutationFn: (values: PropertyFormValues) => propertiesService.update(property.id, { ...values, amenities: [...values.amenities] }),
    onSuccess: async () => {
      await refresh()
      toast.success('Listing updated.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not update the listing.'),
  })

  const generate = useMutation({
    mutationFn: () => aiService.generateDescription(property.id, tone),
    onSuccess: (description) => {
      setValue('description', description)
      toast.success('AI description ready to review.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not generate a description.'),
  })

  const upload = useMutation({
    mutationFn: (file: File) => propertiesService.uploadImage(property.id, file),
    onSuccess: async () => {
      await refresh()
      toast.success('Image uploaded.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not upload the image.'),
  })

  const reorder = useMutation({
    mutationFn: (imageIds: string[]) => propertiesService.reorderImages(property.id, imageIds),
    onSuccess: async () => {
      await refresh()
      toast.success('Image order updated.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not reorder images.'),
  })

  const setCover = useMutation({
    mutationFn: (imageId: string) => propertiesService.setCoverImage(property.id, imageId),
    onSuccess: async () => {
      await refresh()
      toast.success('Cover image updated.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not set the cover image.'),
  })

  const removeImage = useMutation({
    mutationFn: (imageId: string) => propertiesService.deleteImage(property.id, imageId),
    onSuccess: async () => {
      await refresh()
      toast.success('Image removed.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not remove the image.'),
  })

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const imageIds = images.map((image) => image.id)
    const current = imageIds[index]
    imageIds[index] = imageIds[target]
    imageIds[target] = current
    reorder.mutate(imageIds)
  }

  return (
    <div className="inquiry-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="inquiry-modal editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" aria-label="Close editor" onClick={onClose}><X size={18} /></button>
        <span className="eyebrow">EDIT LISTING</span>
        <h2 id="editor-title">{property.title}</h2>
        <form className="dashboard-form editor-form" onSubmit={handleSubmit((values) => update.mutate(values))}>
          <div className="form-grid">
            <label className="form-full">Title<input className="field-control" {...register('title')} /></label>
            <label className="form-full">Description<textarea className="field-control" rows={4} {...register('description')} /></label>
            <div className="form-full ai-generate-row">
              <select className="field-control" value={tone} onChange={(event) => setTone(event.target.value as DescriptionTone)} aria-label="Description tone">
                {DESCRIPTION_TONES.map((option) => <option key={option}>{option}</option>)}
              </select>
              <button className="btn btn-outline btn-small" type="button" disabled={generate.isPending} onClick={() => generate.mutate()}>
                {generate.isPending ? <LoaderCircle className="spin" size={14} /> : <Sparkles size={14} />}Generate description
              </button>
            </div>
            <label>Property type<select className="field-control" {...register('propertyType')}>{PROPERTY_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label>Purpose<select className="field-control" {...register('purpose')}>{PROPERTY_PURPOSES.map((purpose) => <option key={purpose}>{purpose}</option>)}</select></label>
            <label>Price (INR)<input className="field-control" type="number" min={1} {...register('price')} /></label>
            <label>Bedrooms<input className="field-control" type="number" min={0} {...register('bedrooms')} /></label>
            <label>Bathrooms<input className="field-control" type="number" min={0} {...register('bathrooms')} /></label>
            <label>Area (sq ft)<input className="field-control" type="number" min={100} {...register('areaSqFt')} /></label>
            <label>Furnishing<select className="field-control" {...register('furnishing')}>{FURNISHING_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label>Address<input className="field-control" {...register('address')} /></label>
            <label>Locality<input className="field-control" {...register('locality')} /></label>
            <label>City<input className="field-control" {...register('city')} /></label>
            <label>State<input className="field-control" {...register('state')} /></label>
            <label>Country<input className="field-control" {...register('country')} /></label>
            <label>Postal code<input className="field-control" {...register('postalCode')} /></label>
            <label className="checkbox-field"><input type="checkbox" {...register('parking')} />Parking available</label>
            <fieldset className="amenity-fieldset">
              <legend>Amenities</legend>
              <div className="amenity-options">
                {PROPERTY_AMENITIES.map((amenity) => (
                  <label key={amenity}><input type="checkbox" value={amenity} {...register('amenities')} />{amenity.replaceAll('_', ' ')}</label>
                ))}
              </div>
            </fieldset>
          </div>
          {Object.keys(errors).length > 0 && <p className="field-error" role="alert">Please check the highlighted fields.</p>}
          <button className="btn btn-primary" type="submit" disabled={update.isPending}>
            {update.isPending ? <LoaderCircle className="spin" size={16} /> : <CheckCircle2 size={16} />}Save listing
          </button>
        </form>
        <section className="dashboard-panel image-manager">
          <div className="dashboard-panel-header"><h2>Images</h2></div>
          <label className="image-upload-field"><UploadCloud size={16} />Add image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) upload.mutate(file)
            event.target.value = ''
          }} /></label>
          {images.length ? (
            <div className="dashboard-list">
              {images.map((image, index) => (
                <div className="dashboard-list-row" key={image.id}>
                  <img className="editor-thumb" src={image.url} alt="" />
                  <div><strong>{image.altText ?? `Image ${index + 1}`}</strong><span>{image.isCover ? 'Cover image' : `Position ${image.position}`}</span></div>
                  <div className="lead-actions">
                    <button className="icon-button" type="button" aria-label={`Move image ${index + 1} up`} disabled={index === 0 || reorder.isPending} onClick={() => moveImage(index, -1)}><ArrowUp size={14} /></button>
                    <button className="icon-button" type="button" aria-label={`Move image ${index + 1} down`} disabled={index === images.length - 1 || reorder.isPending} onClick={() => moveImage(index, 1)}><ArrowDown size={14} /></button>
                    <button className="icon-button" type="button" aria-label={`Make image ${index + 1} the cover`} disabled={image.isCover || setCover.isPending} onClick={() => setCover.mutate(image.id)}><Star size={14} /></button>
                    <button className="icon-button danger" type="button" aria-label={`Delete image ${index + 1}`} disabled={removeImage.isPending} onClick={() => removeImage.mutate(image.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="muted">No images uploaded yet.</p>}
        </section>
      </div>
    </div>
  )
}

export function MyPropertiesPage() {
  const queryClient = useQueryClient()
  const properties = useQuery({ queryKey: ['properties', 'mine'], queryFn: () => propertiesService.listMine({ limit: 50 }) })
  const [image, setImage] = useState<File | null>(null)
  const [submitForApproval, setSubmitForApproval] = useState(false)
  const [editing, setEditing] = useState<Property | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PropertyFormInput, unknown, PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: '',
      description: '',
      propertyType: 'APARTMENT',
      purpose: 'SALE',
      price: 0,
      bedrooms: 1,
      bathrooms: 1,
      areaSqFt: 500,
      amenities: [],
      furnishing: 'UNFURNISHED',
      parking: false,
      address: '',
      locality: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
    },
  })

  const create = useMutation({
    mutationFn: async (values: PropertyFormValues) => {
      const property = await propertiesService.create({ ...values, amenities: [...values.amenities] })
      if (image) await propertiesService.uploadImage(property.id, image)
      if (submitForApproval) await propertiesService.changeStatus(property.id, 'PENDING')
      return property
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['properties'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'agent'] })
      reset()
      setImage(null)
      setSubmitForApproval(false)
      toast.success(submitForApproval ? 'Listing submitted for approval.' : 'Draft listing created.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not create listing.'),
  })

  const submitStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'PENDING' | 'ARCHIVED' }) => propertiesService.changeStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast.success('Listing status updated.')
    },
  })

  const archive = useMutation({
    mutationFn: (id: string) => propertiesService.archive(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['properties'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'agent'] })
      toast.success('Listing archived.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not archive the listing.'),
  })

  return (
    <div className="page-shell dashboard-page">
      <header className="dashboard-header">
        <span className="eyebrow">AGENT LISTINGS</span>
        <h1>My properties</h1>
        <p>Create drafts, upload a cover image, and submit verified listings for admin approval.</p>
      </header>
      <form className="dashboard-form" onSubmit={handleSubmit((values) => create.mutate(values))}>
        <h2>Create a new listing</h2>
        <div className="form-grid">
          <label className="form-full">Title<input className="field-control" {...register('title')} /></label>
          <label className="form-full">Description<textarea className="field-control" rows={4} {...register('description')} /></label>
          <label>Property type<select className="field-control" {...register('propertyType')}>{PROPERTY_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label>Purpose<select className="field-control" {...register('purpose')}>{PROPERTY_PURPOSES.map((purpose) => <option key={purpose}>{purpose}</option>)}</select></label>
          <label>Price (INR)<input className="field-control" type="number" min={1} {...register('price')} /></label>
          <label>Bedrooms<input className="field-control" type="number" min={0} {...register('bedrooms')} /></label>
          <label>Bathrooms<input className="field-control" type="number" min={0} {...register('bathrooms')} /></label>
          <label>Area (sq ft)<input className="field-control" type="number" min={100} {...register('areaSqFt')} /></label>
          <label>Furnishing<select className="field-control" {...register('furnishing')}>{FURNISHING_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label>Address<input className="field-control" {...register('address')} /></label>
          <label>Locality<input className="field-control" {...register('locality')} /></label>
          <label>City<input className="field-control" {...register('city')} /></label>
          <label>State<input className="field-control" {...register('state')} /></label>
          <label>Country<input className="field-control" {...register('country')} /></label>
          <label>Postal code<input className="field-control" {...register('postalCode')} /></label>
          <label className="checkbox-field"><input type="checkbox" {...register('parking')} />Parking available</label>
          <fieldset className="amenity-fieldset">
            <legend>Amenities</legend>
            <div className="amenity-options">
              {PROPERTY_AMENITIES.map((amenity) => (
                <label key={amenity}><input type="checkbox" value={amenity} {...register('amenities')} />{amenity.replaceAll('_', ' ')}</label>
              ))}
            </div>
          </fieldset>
          <label className="form-full file-field"><UploadCloud size={16} />Cover image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} /></label>
          <label className="checkbox-field"><input type="checkbox" checked={submitForApproval} onChange={(event) => setSubmitForApproval(event.target.checked)} />Submit for approval immediately</label>
        </div>
        {Object.keys(errors).length > 0 && <p className="field-error" role="alert">Please check the highlighted fields.</p>}
        <button className="btn btn-primary" type="submit" disabled={create.isPending}>
          {create.isPending ? <LoaderCircle className="spin" size={16} /> : <Building2 size={16} />}Create listing
        </button>
      </form>
      <section className="dashboard-panel">
        <div className="dashboard-panel-header"><h2>Your listings</h2></div>
        {properties.data?.properties.length ? (
          <div className="dashboard-list">
            {properties.data.properties.map((property) => (
              <div className="dashboard-list-row" key={property.id}>
                <div><strong>{property.title}</strong><span>{property.city} · {formatCompactPrice(property.price)} · {property.status}</span></div>
                <div className="lead-actions">
                  <Link className="btn btn-outline btn-small" to={`/properties/${property.id}`}>View</Link>
                  {property.status === 'DRAFT' && (
                    <button className="btn btn-primary btn-small" type="button" disabled={submitStatus.isPending} onClick={() => submitStatus.mutate({ id: property.id, status: 'PENDING' })}><Send size={14} />Submit</button>
                  )}
                  {property.status === 'PENDING' && <span className="status-chip"><CheckCircle2 size={13} />IN REVIEW</span>}
                  <button className="btn btn-outline btn-small" type="button" onClick={() => setEditing(property)}><Pencil size={14} />Edit</button>
                  {property.status !== 'ARCHIVED' && (
                    <button className="btn btn-outline btn-small danger" type="button" disabled={archive.isPending} onClick={() => archive.mutate(property.id)}><Archive size={14} />Archive</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : <StatusPanel icon={Building2} title="No listings yet" description="Create your first property listing above." />}
      </section>
      {editing && <PropertyEditor property={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

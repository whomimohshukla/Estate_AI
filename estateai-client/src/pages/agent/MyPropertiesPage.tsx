import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, CheckCircle2, LoaderCircle, Send, UploadCloud } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { StatusPanel } from '../../components/common/StatusPanel'
import { ApiError } from '../../lib/api'
import { formatCompactPrice } from '../../lib/format'
import { propertiesService } from '../../services/properties.service'
import {
  FURNISHING_STATUSES,
  PROPERTY_AMENITIES,
  PROPERTY_PURPOSES,
  PROPERTY_TYPES,
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

export function MyPropertiesPage() {
  const queryClient = useQueryClient()
  const properties = useQuery({ queryKey: ['properties', 'mine'], queryFn: () => propertiesService.listMine({ limit: 50 }) })
  const [image, setImage] = useState<File | null>(null)
  const [submitForApproval, setSubmitForApproval] = useState(false)
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
                </div>
              </div>
            ))}
          </div>
        ) : <StatusPanel icon={Building2} title="No listings yet" description="Create your first property listing above." />}
      </section>
    </div>
  )
}

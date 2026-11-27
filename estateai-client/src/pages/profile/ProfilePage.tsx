import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, LoaderCircle, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { StatusPanel } from '../../components/common/StatusPanel'
import { ApiError } from '../../lib/api'
import { usersService } from '../../services/users.service'
import { useAuthStore } from '../../store/auth-store'
import '../dashboard/dashboard.css'

const profileSchema = z.object({
  firstName: z.string().trim().min(2, 'Enter at least 2 characters').max(50),
  lastName: z.string().trim().min(2, 'Enter at least 2 characters').max(50),
  phone: z.union([z.literal(''), z.string().trim().min(10, 'Enter a valid phone number').max(15)]),
  avatarUrl: z.union([z.literal(''), z.string().trim().url('Enter a valid image URL').max(2048)]),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfilePage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const profile = useQuery({ queryKey: ['profile'], queryFn: () => usersService.getMe(), retry: false })
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      avatarUrl: user?.avatarUrl ?? '',
    },
  })

  useEffect(() => {
    if (!profile.data) return
    reset({
      firstName: profile.data.firstName,
      lastName: profile.data.lastName,
      phone: profile.data.phone ?? '',
      avatarUrl: profile.data.avatarUrl ?? '',
    })
  }, [profile.data, reset])

  const update = useMutation({
    mutationFn: (values: ProfileFormValues) => usersService.updateMe({
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone || null,
      avatarUrl: values.avatarUrl || null,
    }),
    onSuccess: async (updatedUser) => {
      setUser(updatedUser)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['auth', 'current-user'] }),
      ])
      toast.success('Profile updated.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not save your profile.'),
  })

  return (
    <div className="page-shell dashboard-page">
      <header className="dashboard-header">
        <span className="eyebrow">YOUR ACCOUNT</span>
        <h1>Profile &amp; security</h1>
        <p>Update your contact details and keep your Estate account secure.</p>
      </header>
      <div className="dashboard-columns">
        <form className="dashboard-form" onSubmit={handleSubmit((values) => update.mutate(values))}>
          <h2>Edit profile</h2>
          {profile.isError && <StatusPanel icon={UserRound} title="Could not load your profile" description="You can still update the fields below using your session details." />}
          <div className="form-grid">
            <label>First name<input className="field-control" {...register('firstName')} /></label>
            <label>Last name<input className="field-control" {...register('lastName')} /></label>
            <label className="form-full">Phone number<input className="field-control" type="tel" placeholder="+91 98765 43210" {...register('phone')} /></label>
            <label className="form-full">Avatar URL<input className="field-control" type="url" placeholder="https://example.com/avatar.jpg" {...register('avatarUrl')} /></label>
          </div>
          {(errors.firstName || errors.lastName || errors.phone || errors.avatarUrl) && <p className="field-error" role="alert">Please check the highlighted fields.</p>}
          <button className="btn btn-primary" type="submit" disabled={update.isPending}>
            {update.isPending ? <LoaderCircle className="spin" size={16} /> : <UserRound size={16} />}Save changes
          </button>
        </form>
        <section className="dashboard-panel">
          <div className="dashboard-panel-header"><h2>Account details</h2></div>
          <div className="engagement-list">
            <div><span>Email</span><strong>{user?.email ?? '—'}</strong></div>
            <div><span>Role</span><strong>{user?.role ?? '—'}</strong></div>
            <div><span>Email verification</span><strong>{user?.isEmailVerified ? 'Verified' : 'Pending'}</strong></div>
            <div><span>Account status</span><strong>{user?.isActive ? 'Active' : 'Inactive'}</strong></div>
          </div>
          <div className="lead-actions profile-actions">
            <Link className="btn btn-outline btn-small" to="/account/change-password"><ShieldCheck size={15} />Change password</Link>
            {!user?.isEmailVerified && <Link className="btn btn-outline btn-small" to="/verify-email"><Mail size={15} />Verify email</Link>}
            {user?.isEmailVerified && <span className="status-chip"><CheckCircle2 size={13} />EMAIL VERIFIED</span>}
          </div>
        </section>
      </div>
    </div>
  )
}

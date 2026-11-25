import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, CheckCircle2, LoaderCircle, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { FormField } from '../../components/forms/FormField'
import { GoogleSignInButton } from '../../components/forms/GoogleSignInButton'
import { PasswordField } from '../../components/forms/PasswordField'
import { ApiError } from '../../lib/api'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../store/auth-store'
import {
  forgotPasswordFormSchema,
  loginFormSchema,
  registerFormSchema,
  resetPasswordFormSchema,
  type ForgotPasswordFormValues,
  type LoginFormValues,
  type RegisterFormValues,
  type ResetPasswordFormValues,
} from '../../features/auth/auth-schemas'
import './auth.css'

function providerErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function AuthDivider() {
  return <div className="auth-divider"><span />or<span /></div>
}

function AuthSubmit({ busy, children, disabled = false }: { busy: boolean; children: string; disabled?: boolean }) {
  return (
    <button className="btn btn-primary auth-submit" type="submit" disabled={busy || disabled}>
      {busy ? <LoaderCircle className="spin" size={17} /> : null}
      {busy ? 'Please wait…' : children}
      {!busy && <ArrowRight size={16} />}
    </button>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  })

  async function submit(values: LoginFormValues) {
    setBusy(true)
    try {
      const session = await authService.login(values)
      setSession(session)
      toast.success(`Welcome back, ${session.user.firstName}.`)
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(providerErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-card">
      <span className="auth-eyebrow">WELCOME BACK</span>
      <h2>Sign in to EstateAI</h2>
      <p className="auth-subtitle">Pick up where your home search left off.</p>
      <GoogleSignInButton />
      <AuthDivider />
      <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
        <FormField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email}
          {...register('email')}
        />
        <div className="auth-password-label-row">
          <span id="login-password-label">Password</span>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <PasswordField labelledBy="login-password-label" registration={register('password')} error={errors.password} autoComplete="current-password" />
        <AuthSubmit busy={busy}>Sign in</AuthSubmit>
      </form>
      <p className="auth-switch">New to EstateAI? <Link to="/signup">Create an account</Link></p>
    </div>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'BUYER' },
  })
  async function submit(values: RegisterFormValues) {
    setBusy(true)
    try {
      const session = await authService.register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
        role: values.role,
      })
      setSession(session)
      toast.success('Account created. Check your email to verify your address.')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(providerErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-card auth-card-register">
      <span className="auth-eyebrow">MAKE YOURSELF AT HOME</span>
      <h2>Create your account</h2>
      <p className="auth-subtitle">A better home search starts with you.</p>
      <GoogleSignInButton />
      <AuthDivider />
      <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
        <div className="auth-name-row">
          <FormField label="First name" placeholder="Aarav" autoComplete="given-name" error={errors.firstName} {...register('firstName')} />
          <FormField label="Last name" placeholder="Sharma" autoComplete="family-name" error={errors.lastName} {...register('lastName')} />
        </div>
        <FormField label="Email address" type="email" placeholder="you@example.com" autoComplete="email" error={errors.email} {...register('email')} />
        <FormField label="Phone number (optional)" type="tel" placeholder="+91 98765 43210" autoComplete="tel" error={errors.phone} {...register('phone')} />
        <fieldset className="role-choice">
          <legend>I’m here as a</legend>
          {(['BUYER', 'AGENT'] as const).map((option) => (
            <label key={option}>
              <input type="radio" value={option} {...register('role')} />
              <span>{option === 'BUYER' ? 'Home seeker' : 'Property agent'}</span>
            </label>
          ))}
        </fieldset>
        <PasswordField label="Password" registration={register('password')} error={errors.password} autoComplete="new-password" />
        <PasswordField label="Confirm password" registration={register('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" />
        <p className="password-rules"><LockKeyhole size={13} />At least 8 characters with uppercase, lowercase and a number.</p>
        <AuthSubmit busy={busy}>Create account</AuthSubmit>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </div>
  )
}

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  })

  async function submit(values: ForgotPasswordFormValues) {
    setBusy(true)
    try {
      await authService.forgotPassword(values.email)
      setSubmitted(true)
      toast.success('If an account exists for that email, a reset link is on its way.')
    } catch (error) {
      toast.error(providerErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  if (submitted) {
    return (
      <div className="auth-card auth-success-card">
        <span className="success-icon"><CheckCircle2 size={26} /></span>
        <span className="auth-eyebrow">CHECK YOUR INBOX</span>
        <h2>Look out for an email.</h2>
        <p className="auth-subtitle">If an account matches that email address, we’ve sent instructions to reset your password.</p>
        <Link className="btn btn-primary auth-submit auth-link-button" to="/login">Back to sign in <ArrowRight size={16} /></Link>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <span className="auth-eyebrow">ACCOUNT RECOVERY</span>
      <h2>Forgot your password?</h2>
      <p className="auth-subtitle">Share your email and we’ll send you a link to reset it.</p>
      <form className="auth-form auth-form-spaced" onSubmit={handleSubmit(submit)} noValidate>
        <FormField label="Email address" type="email" placeholder="you@example.com" autoComplete="email" error={errors.email} {...register('email')} />
        <AuthSubmit busy={busy}>Send reset link</AuthSubmit>
      </form>
      <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
    </div>
  )
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function submit(values: ResetPasswordFormValues) {
    if (!token) {
      toast.error('This reset link is missing its token. Request a new one.')
      return
    }
    setBusy(true)
    try {
      await authService.resetPassword({ token, password: values.password })
      setSubmitted(true)
      toast.success('Your password has been updated.')
    } catch (error) {
      toast.error(providerErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  if (submitted) {
    return (
      <div className="auth-card auth-success-card">
        <span className="success-icon"><CheckCircle2 size={26} /></span>
        <span className="auth-eyebrow">PASSWORD UPDATED</span>
        <h2>You’re all set.</h2>
        <p className="auth-subtitle">Your password has been changed. Sign in with your new password to continue.</p>
        <button className="btn btn-primary auth-submit" type="button" onClick={() => navigate('/login')}>Sign in <ArrowRight size={16} /></button>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <span className="auth-eyebrow">SECURE YOUR ACCOUNT</span>
      <h2>Choose a new password</h2>
      <p className="auth-subtitle">Make it strong and something you haven’t used before.</p>
      {!token && <p className="auth-inline-alert" role="alert"><Mail size={15} />No reset token found. Request a new password reset link first.</p>}
      <form className="auth-form auth-form-spaced" onSubmit={handleSubmit(submit)} noValidate>
        <PasswordField label="New password" registration={register('password')} error={errors.password} autoComplete="new-password" />
        <PasswordField label="Confirm new password" registration={register('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" />
        <AuthSubmit busy={busy} disabled={!token}>Update password</AuthSubmit>
      </form>
      <p className="auth-switch">Remembered it? <Link to="/login">Sign in</Link></p>
    </div>
  )
}

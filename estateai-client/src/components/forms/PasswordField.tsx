import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form'

interface PasswordFieldProps {
  label?: string
  labelledBy?: string
  registration: UseFormRegisterReturn
  error?: FieldError
  autoComplete: 'current-password' | 'new-password'
}

export function PasswordField({ label, labelledBy, registration, error, autoComplete }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const fieldId = registration.name

  return (
    <div className={`auth-field ${error ? 'has-error' : ''}`}>
      {label && <label htmlFor={fieldId}>{label}</label>}
      <div className="auth-input-wrap">
        <input
          id={fieldId}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          aria-labelledby={labelledBy}
          {...registration}
        />
        <button
          className="password-toggle"
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error && <span className="field-error" id={`${fieldId}-error`} role="alert">{error.message}</span>}
    </div>
  )
}

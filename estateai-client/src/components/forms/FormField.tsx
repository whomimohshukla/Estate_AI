import type { InputHTMLAttributes, ReactNode } from 'react'
import type { FieldError } from 'react-hook-form'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: FieldError
  hint?: ReactNode
  trailing?: ReactNode
}

export function FormField({ label, error, hint, trailing, id, ...inputProps }: FormFieldProps) {
  const fieldId = id ?? inputProps.name

  return (
    <div className={`auth-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={fieldId}>{label}</label>
      <div className="auth-input-wrap">
        <input id={fieldId} aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : undefined} {...inputProps} />
        {trailing}
      </div>
      {error && <span className="field-error" id={`${fieldId}-error`} role="alert">{error.message}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  )
}

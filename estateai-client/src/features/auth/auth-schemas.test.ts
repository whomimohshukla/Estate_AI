import { describe, expect, it } from 'vitest'
import { changePasswordFormSchema, loginFormSchema, registerFormSchema, resetPasswordFormSchema } from './auth-schemas'

describe('auth form validation', () => {
  it('normalizes email casing and whitespace for sign-in', () => {
    expect(loginFormSchema.parse({ email: '  BUYER@example.com ', password: 'pass' })).toEqual({
      email: 'buyer@example.com',
      password: 'pass',
    })
  })

  it('enforces the backend password rules and confirmation', () => {
    const invalid = registerFormSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Singh',
      email: 'ada@example.com',
      phone: '',
      password: 'short',
      confirmPassword: 'short',
      role: 'BUYER',
    })
    expect(invalid.success).toBe(false)

    const mismatch = resetPasswordFormSchema.safeParse({
      password: 'GoodPass8',
      confirmPassword: 'Different8',
    })
    expect(mismatch.success).toBe(false)
  })

  it('requires a matching new password when changing passwords', () => {
    const invalid = changePasswordFormSchema.safeParse({
      currentPassword: 'OldPass8',
      newPassword: 'NewPass8',
      confirmPassword: 'Different8',
    })
    expect(invalid.success).toBe(false)
  })

  it('only accepts backend-supported account roles', () => {
    const invalid = registerFormSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Singh',
      email: 'ada@example.com',
      phone: '',
      password: 'GoodPass8',
      confirmPassword: 'GoodPass8',
      role: 'ADMIN',
    })
    expect(invalid.success).toBe(false)
  })
})

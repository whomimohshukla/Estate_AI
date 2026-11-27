import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { ApiFailure, ApiSuccess, SafeUser } from '../types/api'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1'

export class ApiError extends Error {
  status?: number
  code?: string
  errors?: unknown[]

  constructor(message: string, options: { status?: number; code?: string; errors?: unknown[] } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.errors = options.errors
  }
}

interface AuthPayload {
  user: SafeUser
  accessToken: string
}

interface RetryConfig extends InternalAxiosRequestConfig {
  estateaiRetried?: boolean
}

export const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { Accept: 'application/json' },
  paramsSerializer: {
    serialize: (params) => {
      const search = new URLSearchParams()
      Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        search.set(key, Array.isArray(value) ? value.join(',') : String(value))
      })
      return search.toString()
    },
  },
})

let accessToken: string | null = null
let refreshRequest: Promise<string> | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

async function refreshAccessToken(): Promise<string> {
  if (!refreshRequest) {
    refreshRequest = axios
      .post<ApiSuccess<AuthPayload>>(`${apiBaseUrl}/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => {
        setAccessToken(data.data.accessToken)
        return data.data.accessToken
      })
      .catch((error: unknown) => {
        setAccessToken(null)
        throw normalizeApiError(error)
      })
      .finally(() => {
        refreshRequest = null
      })
  }
  return refreshRequest
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (!axios.isAxiosError<ApiFailure>(error)) {
    return new ApiError(error instanceof Error ? error.message : 'Something went wrong')
  }
  const response = error.response
  return new ApiError(response?.data?.message ?? error.message ?? 'The request could not be completed', {
    status: response?.status,
    code: response?.data?.code,
    errors: response?.data?.errors,
  })
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiFailure>) => {
    const config = error.config as RetryConfig | undefined
    const requestUrl = config?.url ?? ''
    const isAuthRequest = /\/auth\/(login|register|refresh|logout|me|forgot-password|reset-password|change-password|password|verify-email)$/.test(requestUrl)

    if (error.response?.status === 401 && config && !config.estateaiRetried && !isAuthRequest) {
      config.estateaiRetried = true
      try {
        const token = await refreshAccessToken()
        config.headers.Authorization = `Bearer ${token}`
        return api.request(config)
      } catch (refreshError: unknown) {
        return Promise.reject(normalizeApiError(refreshError))
      }
    }

    return Promise.reject(normalizeApiError(error))
  },
)

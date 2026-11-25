import type { ApiSuccess } from '../types/api'

export async function unwrap<T>(request: Promise<{ data: ApiSuccess<T> }>): Promise<T> {
  const { data } = await request
  return data.data
}

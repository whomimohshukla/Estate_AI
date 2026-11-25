import type { Response } from 'express';

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: unknown[];
  code?: string;
}

export function success<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response {
  const body: ApiSuccess<T> = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function failure(
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown[],
  code?: string,
): Response {
  const body: ApiFailure = { success: false, message };
  if (errors?.length) body.errors = errors;
  if (code) body.code = code;
  return res.status(statusCode).json(body);
}

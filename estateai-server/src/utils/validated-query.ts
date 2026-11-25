import type { Request } from 'express';

export function validatedQuery<T>(req: Request): T {
  return (req.validatedQuery ?? req.query) as T;
}

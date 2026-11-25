import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { BadRequestError } from '../utils/AppError.js';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      next(new BadRequestError('Validation failed', result.error.issues));
      return;
    }

    if (target === 'query') {
      Object.defineProperty(req, 'validatedQuery', { value: result.data, configurable: true });
    } else {
      req[target] = result.data;
    }

    next();
  };
}

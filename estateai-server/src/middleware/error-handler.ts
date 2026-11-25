import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';
import { failure } from '../utils/api-response.js';

export function notFoundHandler(req: Request, res: Response): Response {
  return failure(res, 404, `Route ${req.method} ${req.originalUrl} not found`, undefined, 'ROUTE_NOT_FOUND');
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): Response {
  if (res.headersSent) {
    return res;
  }

  if (error instanceof ZodError) {
    return failure(res, 400, 'Validation failed', error.issues, 'VALIDATION_ERROR');
  }

  if (error instanceof jwt.TokenExpiredError) {
    return failure(res, 401, 'Token has expired', undefined, 'TOKEN_EXPIRED');
  }

  if (error instanceof jwt.JsonWebTokenError) {
    return failure(res, 401, 'Invalid token', undefined, 'INVALID_TOKEN');
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      return failure(res, 409, `A record with this ${target} already exists`, undefined, 'DUPLICATE_VALUE');
    }
    if (error.code === 'P2025') {
      return failure(res, 404, 'Resource not found', undefined, 'NOT_FOUND');
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return failure(res, 400, 'Invalid database query', undefined, 'INVALID_QUERY');
  }

  if (error instanceof AppError) {
    const errors = error.details !== undefined ? [error.details] : undefined;
    return failure(res, error.statusCode, error.message, errors, error.code);
  }

  if (error instanceof multer.MulterError) {
    return failure(res, 400, `Upload failed: ${error.message}`, undefined, 'UPLOAD_ERROR');
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return failure(res, 400, 'Malformed JSON body', undefined, 'MALFORMED_JSON');
  }

  logger.error({ err: error, requestId: req.requestId }, 'Unhandled request error');
  return failure(res, 500, 'Internal server error', undefined, 'INTERNAL_ERROR');
}

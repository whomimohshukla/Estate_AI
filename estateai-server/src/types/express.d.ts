import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      validatedQuery?: unknown;
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}

export {};

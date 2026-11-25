import { randomBytes, createHash, randomUUID } from 'node:crypto';

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createRequestId(): string {
  return randomUUID();
}

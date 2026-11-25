import { describe, expect, it } from 'vitest';
import { comparePassword, hashPassword } from '../src/utils/password.js';
import { hashToken } from '../src/utils/tokens.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../src/utils/jwt.js';

describe('password utilities', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('Password123');

    expect(hash).not.toContain('Password123');
    expect(await comparePassword('Password123', hash)).toBe(true);
    expect(await comparePassword('WrongPassword123', hash)).toBe(false);
  });
});

describe('token utilities', () => {
  it('hashes tokens deterministically', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toBe(hashToken('abd'));
  });

  it('signs and verifies access and refresh tokens', () => {
    const accessToken = signAccessToken({ sub: 'user-1', email: 'a@b.com', role: 'BUYER' });
    const refreshToken = signRefreshToken({ sub: 'user-1', tokenId: 'token-1' });

    expect(verifyAccessToken(accessToken).sub).toBe('user-1');
    expect(verifyRefreshToken(refreshToken).tokenId).toBe('token-1');
    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });
});

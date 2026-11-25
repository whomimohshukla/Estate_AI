import { randomUUID } from 'node:crypto';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { hashToken } from '../src/utils/tokens.js';

const app: Express = createApp();
const suffix = randomUUID().slice(0, 8);
const buyerEmail = `buyer-${suffix}@example.com`;
const agentEmail = `agent-${suffix}@example.com`;
const createdUserIds: string[] = [];

function cookieHeaders(response: request.Response): string[] {
  const value = response.headers['set-cookie'];
  return Array.isArray(value) ? value.map(String) : [];
}

function refreshCookie(response: request.Response): string {
  const cookie = cookieHeaders(response).find((value) => value.startsWith('refreshToken='));
  if (!cookie) throw new Error('refreshToken cookie missing');
  return cookie.split(';')[0]!;
}

async function register(email: string, role: 'BUYER' | 'AGENT') {
  const response = await request(app).post('/api/v1/auth/register').send({
    email,
    password: 'Password123',
    firstName: 'Test',
    lastName: 'User',
    role,
  });

  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);
  createdUserIds.push(response.body.data.user.id);
  return response;
}

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  await prisma.$disconnect();
});

describe('authentication API', () => {
  it('registers a buyer and returns an access token', async () => {
    const response = await register(buyerEmail, 'BUYER');

    expect(response.body.data.user.email).toBe(buyerEmail);
    expect(response.body.data.user.role).toBe('BUYER');
    expect(response.body.data.accessToken).toBeTypeOf('string');
    expect(cookieHeaders(response).join(' ')).toContain('HttpOnly');
  });

  it('rejects duplicate registrations and weak passwords', async () => {
    const duplicate = await request(app).post('/api/v1/auth/register').send({
      email: buyerEmail,
      password: 'Password123',
      firstName: 'Test',
      lastName: 'User',
    });
    expect(duplicate.status).toBe(409);

    const weak = await request(app).post('/api/v1/auth/register').send({
      email: `weak-${suffix}@example.com`,
      password: 'weak',
      firstName: 'Test',
      lastName: 'User',
    });
    expect(weak.status).toBe(400);
    expect(weak.body.success).toBe(false);
  });

  it('logs in and protects authenticated routes', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: buyerEmail, password: 'Password123' });

    expect(login.status).toBe(200);
    const token = login.body.data.accessToken as string;

    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(buyerEmail);

    const anonymous = await request(app).get('/api/v1/users/me');
    expect(anonymous.status).toBe(401);

    const invalid = await request(app).get('/api/v1/users/me').set('Authorization', 'Bearer invalid.token');
    expect(invalid.status).toBe(401);
  });

  it('rejects bad credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: buyerEmail, password: 'WrongPassword123' });

    expect(response.status).toBe(401);
  });

  it('rotates refresh tokens and detects reuse', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: buyerEmail, password: 'Password123' });

    expect(login.status).toBe(200);
    const oldCookie = refreshCookie(login);
    const oldToken = oldCookie.replace('refreshToken=', '');

    const refreshed = await request(app).post('/api/v1/auth/refresh').set('Cookie', oldCookie);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toBeTypeOf('string');

    const reused = await request(app).post('/api/v1/auth/refresh').set('Cookie', oldCookie);
    expect(reused.status).toBe(401);

    const newCookie = refreshCookie(refreshed);
    const afterRevocation = await request(app).post('/api/v1/auth/refresh').set('Cookie', newCookie);
    expect(afterRevocation.status).toBe(401);
  });

  it('updates profile and changes password', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: buyerEmail, password: 'Password123' });
    const token = login.body.data.accessToken as string;

    const updated = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Updated' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.user.firstName).toBe('Updated');

    const changed = await request(app)
      .patch('/api/v1/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Password123', newPassword: 'NewPassword123' });
    expect(changed.status).toBe(200);

    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: buyerEmail, password: 'Password123' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: buyerEmail, password: 'NewPassword123' });
    expect(newLogin.status).toBe(200);
  });

  it('verifies email with a stored token', async () => {
    await register(agentEmail, 'AGENT');
    const user = await prisma.user.findUniqueOrThrow({ where: { email: agentEmail } });
    const token = randomUUID();

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const response = await request(app).post('/api/v1/auth/verify-email').send({ token });
    expect(response.status).toBe(200);

    const verified = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(verified.isEmailVerified).toBe(true);
  });
});

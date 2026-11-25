import { randomUUID } from 'node:crypto';
import type { Express } from 'express';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/database.js';

const app: Express = createApp();
const suffix = randomUUID().slice(0, 8);
const agentEmail = `ai-agent-${suffix}@example.com`;
const buyerEmail = `ai-buyer-${suffix}@example.com`;
const adminEmail = `ai-admin-${suffix}@example.com`;
const password = 'Password123';
const userIds: string[] = [];
const propertyIds: string[] = [];

const pngBuffer = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#fff' } })
  .png()
  .toBuffer();

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function register(email: string, role: 'AGENT' | 'BUYER'): Promise<string> {
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password, firstName: 'AI', lastName: 'Tester', role });
  expect(response.status).toBe(201);
  userIds.push(response.body.data.user.id);
  return response.body.data.accessToken as string;
}

beforeAll(async () => {
  await prisma.$connect();
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'ADMIN',
      firstName: 'AI',
      lastName: 'Admin',
      isEmailVerified: true,
    },
  });
  userIds.push(admin.id);
});

afterAll(async () => {
  if (propertyIds.length) await prisma.property.deleteMany({ where: { id: { in: propertyIds } } });
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe('AI discovery API', () => {
  let agentToken: string;
  let buyerToken: string;
  let adminToken: string;
  let propertyId: string;

  it('publishes a test listing for AI discovery', async () => {
    agentToken = await register(agentEmail, 'AGENT');
    buyerToken = await register(buyerEmail, 'BUYER');

    const created = await request(app)
      .post('/api/v1/properties')
      .set(auth(agentToken))
      .send({
        title: 'AI test 2BHK in Pune',
        description: 'A verified 2BHK apartment with gym and parking in Pune for sale.',
        propertyType: 'APARTMENT',
        purpose: 'SALE',
        price: 5000000,
        bedrooms: 2,
        bathrooms: 2,
        areaSqFt: 1000,
        amenities: ['PARKING', 'GYM'],
        furnishing: 'FURNISHED',
        parking: true,
        address: '1 AI Street',
        locality: 'Baner',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '411045',
      });
    expect(created.status).toBe(201);
    propertyId = created.body.data.property.id;
    propertyIds.push(propertyId);

    const image = await request(app)
      .post(`/api/v1/properties/${propertyId}/images`)
      .set(auth(agentToken))
      .attach('image', pngBuffer, { filename: 'listing.png', contentType: 'image/png' });
    expect(image.status).toBe(201);

    const submitted = await request(app)
      .patch(`/api/v1/properties/${propertyId}/status`)
      .set(auth(agentToken))
      .send({ status: 'PENDING' });
    expect(submitted.status).toBe(200);

    const adminLogin = await request(app).post('/api/v1/auth/login').send({ email: adminEmail, password });
    adminToken = adminLogin.body.data.accessToken as string;

    const approved = await request(app)
      .patch(`/api/v1/admin/properties/${propertyId}/approve`)
      .set(auth(adminToken));
    expect(approved.status).toBe(200);
  });

  it('uses natural language filters and hybrid ranking', async () => {
    const response = await request(app)
      .post('/api/v1/ai/search')
      .send({ query: '2BHK apartment under 80 lakh with parking' });

    expect(response.status).toBe(200);
    expect(response.body.data.interpretedFilters.city).toBeNull();
    expect(response.body.data.interpretedFilters.maxPrice).toBe(8_000_000);
    expect(response.body.data.interpretedFilters.amenities).toContain('PARKING');
    expect(response.body.data.ranking).toBe('hybrid');
    expect(response.body.data.properties.some((item: { id: string }) => item.id === propertyId)).toBe(true);
  });

  it('respects strict budget requirements', async () => {
    const response = await request(app)
      .post('/api/v1/ai/search')
      .send({ query: '2BHK apartment in Pune under 10 lakh for sale' });

    expect(response.status).toBe(200);
    expect(response.body.data.properties.some((item: { id: string }) => item.id === propertyId)).toBe(false);
    expect(response.body.data.meta.total).toBe(0);
    expect(Array.isArray(response.body.data.suggestions)).toBe(true);
  });

  it('generates factual descriptions only for the owning agent', async () => {
    const generated = await request(app)
      .post('/api/v1/ai/generate-description')
      .set(auth(agentToken))
      .send({ propertyId, tone: 'PROFESSIONAL' });

    expect(generated.status).toBe(200);
    expect(generated.body.data.description.detailedDescription).toContain('Pune');
    expect(generated.body.data.description.highlights.length).toBeGreaterThan(0);

    const forbidden = await request(app)
      .post('/api/v1/ai/generate-description')
      .set(auth(buyerToken))
      .send({ propertyId });

    expect(forbidden.status).toBe(403);
  });

  it('syncs and reindexes embeddings through the API', async () => {
    const synced = await request(app)
      .post(`/api/v1/ai/embeddings/${propertyId}`)
      .set(auth(agentToken));
    expect(synced.status).toBe(200);
    expect(typeof synced.body.data.synced).toBe('boolean');

    const embedding = await prisma.propertyEmbedding.findUnique({ where: { propertyId } });
    expect(embedding).not.toBeNull();

    const reindexed = await request(app).post('/api/v1/ai/embeddings/reindex').set(auth(adminToken));
    expect(reindexed.status).toBe(200);
    expect(typeof reindexed.body.data.synced).toBe('number');

    const forbidden = await request(app).post('/api/v1/ai/embeddings/reindex').set(auth(buyerToken));
    expect(forbidden.status).toBe(403);
  });
});

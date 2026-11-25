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
const agentEmail = `agent-${suffix}@example.com`;
const otherAgentEmail = `agent2-${suffix}@example.com`;
const buyerEmail = `buyer-${suffix}@example.com`;
const adminEmail = `admin-${suffix}@example.com`;
const password = 'Password123';
const userIds: string[] = [];
const propertyIds: string[] = [];

const pngBuffer = await sharp({
  create: { width: 16, height: 16, channels: 3, background: '#ffffff' },
})
  .png()
  .toBuffer();

async function register(email: string, role: 'AGENT' | 'BUYER'): Promise<string> {
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password, firstName: 'Property', lastName: 'Tester', role });

  expect(response.status).toBe(201);
  userIds.push(response.body.data.user.id);
  return response.body.data.accessToken as string;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function createProperty(token: string, overrides: Record<string, unknown> = {}) {
  const response = await request(app)
    .post('/api/v1/properties')
    .set(auth(token))
    .send({
      title: `Test property ${suffix}`,
      description: 'A verified test listing with gym and parking near the metro station.',
      propertyType: 'APARTMENT',
      purpose: 'SALE',
      price: 6500000,
      bedrooms: 2,
      bathrooms: 2,
      areaSqFt: 1100,
      amenities: ['PARKING', 'GYM'],
      furnishing: 'SEMI_FURNISHED',
      parking: true,
      address: '12 Test Street',
      locality: 'Test Locality',
      city: 'Testville',
      state: 'Test State',
      country: 'India',
      postalCode: '110001',
      latitude: 28.6,
      longitude: 77.3,
      ...overrides,
    });

  expect(response.status).toBe(201);
  propertyIds.push(response.body.data.property.id);
  return response.body.data.property.id as string;
}

beforeAll(async () => {
  await prisma.$connect();
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'ADMIN',
      firstName: 'Platform',
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

describe('property marketplace API', () => {
  it('creates drafts, enforces ownership and hides unapproved listings', async () => {
    const agentToken = await register(agentEmail, 'AGENT');
    const otherAgentToken = await register(otherAgentEmail, 'AGENT');
    const buyerToken = await register(buyerEmail, 'BUYER');
    const propertyId = await createProperty(agentToken);

    const draftDetail = await request(app).get(`/api/v1/properties/${propertyId}`);
    expect(draftDetail.status).toBe(404);

    const ownerDetail = await request(app).get(`/api/v1/properties/${propertyId}`).set(auth(agentToken));
    expect(ownerDetail.status).toBe(200);
    expect(ownerDetail.body.data.property.status).toBe('DRAFT');

    const publicList = await request(app).get('/api/v1/properties?city=Testville');
    expect(publicList.status).toBe(200);
    expect(publicList.body.data).toHaveLength(0);

    const foreignUpdate = await request(app)
      .patch(`/api/v1/properties/${propertyId}`)
      .set(auth(otherAgentToken))
      .send({ title: 'Stolen property title' });
    expect(foreignUpdate.status).toBe(403);

    const buyerCreate = await request(app)
      .post('/api/v1/properties')
      .set(auth(buyerToken))
      .send({ title: 'Not allowed' });
    expect(buyerCreate.status).toBe(403);
  });

  it('uploads images, submits for approval and publishes after admin approval', async () => {
    const agentToken = await register(`images-${suffix}@example.com`, 'AGENT');
    const propertyId = await createProperty(agentToken, { city: 'ApprovalCity', price: 4200000 });
    userIds.push(
      (await prisma.property.findUniqueOrThrow({ where: { id: propertyId } })).agentId,
    );

    const invalidImage = await request(app)
      .post(`/api/v1/properties/${propertyId}/images`)
      .set(auth(agentToken))
      .attach('image', pngBuffer, { filename: 'note.txt', contentType: 'text/plain' });
    expect(invalidImage.status).toBe(400);

    const uploaded = await request(app)
      .post(`/api/v1/properties/${propertyId}/images`)
      .set(auth(agentToken))
      .attach('image', pngBuffer, { filename: 'property.png', contentType: 'image/png' });
    expect(uploaded.status).toBe(201);
    expect(uploaded.body.data.image.isCover).toBe(true);

    const submitted = await request(app)
      .patch(`/api/v1/properties/${propertyId}/status`)
      .set(auth(agentToken))
      .send({ status: 'PENDING' });
    expect(submitted.status).toBe(200);

    const adminTokenResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password });
    expect(adminTokenResponse.status).toBe(200);
    const adminToken = adminTokenResponse.body.data.accessToken as string;

    const pending = await request(app).get('/api/v1/admin/properties/pending').set(auth(adminToken));
    expect(pending.status).toBe(200);
    expect(pending.body.data.some((item: { id: string }) => item.id === propertyId)).toBe(true);

    const approved = await request(app)
      .patch(`/api/v1/admin/properties/${propertyId}/approve`)
      .set(auth(adminToken));
    expect(approved.status).toBe(200);
    expect(approved.body.data.property.status).toBe('AVAILABLE');

    const visible = await request(app).get(`/api/v1/properties/${propertyId}`);
    expect(visible.status).toBe(200);
    expect(visible.body.data.property.status).toBe('AVAILABLE');
  });

  it('filters published listings by city, price and bedrooms', async () => {
    const agentToken = await register(`filter-${suffix}@example.com`, 'AGENT');
    const propertyId = await createProperty(agentToken, {
      title: 'Filter test apartment',
      city: 'FilterCity',
      price: 3000000,
      bedrooms: 3,
    });

    const image = await request(app)
      .post(`/api/v1/properties/${propertyId}/images`)
      .set(auth(agentToken))
      .attach('image', pngBuffer, { filename: 'property.png', contentType: 'image/png' });
    expect(image.status).toBe(201);

    const submitted = await request(app)
      .patch(`/api/v1/properties/${propertyId}/status`)
      .set(auth(agentToken))
      .send({ status: 'PENDING' });
    expect(submitted.status).toBe(200);

    const adminTokenResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password });
    const approved = await request(app)
      .patch(`/api/v1/admin/properties/${propertyId}/approve`)
      .set(auth(adminTokenResponse.body.data.accessToken));
    expect(approved.status).toBe(200);

    const matching = await request(app).get(
      '/api/v1/properties?city=FilterCity&maxPrice=3500000&bedrooms=3&sortBy=price&sortOrder=asc',
    );
    expect(matching.status).toBe(200);
    expect(matching.body.data.some((item: { id: string }) => item.id === propertyId)).toBe(true);

    const nonMatching = await request(app).get('/api/v1/properties?city=FilterCity&maxPrice=1000000');
    expect(nonMatching.body.data.some((item: { id: string }) => item.id === propertyId)).toBe(false);
  });
});

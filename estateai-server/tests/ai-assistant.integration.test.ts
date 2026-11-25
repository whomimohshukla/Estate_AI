import { randomUUID } from 'node:crypto';
import type { Express } from 'express';
import request from 'supertest';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/database.js';

const app: Express = createApp();
const suffix = randomUUID().slice(0, 8);
const agentEmail = `assistant-agent-${suffix}@example.com`;
const buyerEmail = `assistant-buyer-${suffix}@example.com`;
const password = 'Password123';
const city = `TestCity${suffix}`;
const userIds: string[] = [];
const propertyIds: string[] = [];
const comparisonIds: string[] = [];

const pngBuffer = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#fff' } })
  .png()
  .toBuffer();

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function register(email: string, role: 'AGENT' | 'BUYER'): Promise<string> {
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password, firstName: 'Assistant', lastName: 'Tester', role });
  expect(response.status).toBe(201);
  userIds.push(response.body.data.user.id);
  return response.body.data.accessToken as string;
}

async function publishProperty(
  token: string,
  adminToken: string,
  title: string,
  price: number,
  bedrooms: number,
  amenities: string[],
): Promise<string> {
  const created = await request(app)
    .post('/api/v1/properties')
    .set(auth(token))
    .send({
      title,
      description: `A verified ${bedrooms} bedroom apartment with ${amenities.join(', ')} in ${city}.`,
      propertyType: 'APARTMENT',
      purpose: 'SALE',
      price,
      bedrooms,
      bathrooms: 2,
      areaSqFt: bedrooms * 500,
      amenities,
      furnishing: 'SEMI_FURNISHED',
      parking: true,
      address: '1 Assistant Street',
      locality: 'Central',
      city,
      state: 'Test State',
      country: 'India',
      postalCode: '100001',
    });
  expect(created.status).toBe(201);
  const id = created.body.data.property.id as string;
  propertyIds.push(id);

  const image = await request(app)
    .post(`/api/v1/properties/${id}/images`)
    .set(auth(token))
    .attach('image', pngBuffer, { filename: 'listing.png', contentType: 'image/png' });
  expect(image.status).toBe(201);

  const submitted = await request(app)
    .patch(`/api/v1/properties/${id}/status`)
    .set(auth(token))
    .send({ status: 'PENDING' });
  expect(submitted.status).toBe(200);

  const approved = await request(app)
    .patch(`/api/v1/admin/properties/${id}/approve`)
    .set(auth(adminToken));
  expect(approved.status).toBe(200);
  return id;
}

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  if (comparisonIds.length) {
    await prisma.auditLog.deleteMany({ where: { id: { in: comparisonIds } } });
  }
  if (propertyIds.length) await prisma.property.deleteMany({ where: { id: { in: propertyIds } } });
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe('AI assistant API', () => {
  let agentToken: string;
  let buyerToken: string;
  let adminToken: string;
  let propertyA: string;
  let propertyB: string;
  let leadId: string;

  it('publishes isolated listings and a lead for assistant tests', async () => {
    agentToken = await register(agentEmail, 'AGENT');
    buyerToken = await register(buyerEmail, 'BUYER');

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@estateai.local', password });
    expect(login.status).toBe(200);
    adminToken = login.body.data.accessToken as string;

    propertyA = await publishProperty(agentToken, adminToken, 'Assistant listing A', 5_000_000, 2, ['PARKING', 'GYM']);
    propertyB = await publishProperty(agentToken, adminToken, 'Assistant listing B', 7_000_000, 3, ['PARKING', 'LIFT']);

    const lead = await prisma.lead.create({
      data: {
        propertyId: propertyA,
        buyerId: userIds[1]!,
        agentId: userIds[0]!,
        budgetMax: 6_000_000,
        requirements: '2BHK with parking and gym',
        message: 'I am looking to buy in this city next month.',
        source: 'AI_SEARCH',
      },
    });
    leadId = lead.id;
  });

  it('answers chat questions from verified listing facts and persists conversations', async () => {
    const chat = await request(app)
      .post('/api/v1/ai/chat')
      .set(auth(buyerToken))
      .send({ propertyId: propertyA, message: 'What is the price of this property?' });

    expect(chat.status).toBe(200);
    expect(chat.body.data.answer).toContain('5000000');
    const conversationId = chat.body.data.conversationId as string;

    const list = await request(app).get('/api/v1/ai/conversations').set(auth(buyerToken));
    expect(list.status).toBe(200);
    expect(list.body.data.conversations.some((item: { id: string }) => item.id === conversationId)).toBe(true);

    const detail = await request(app)
      .get(`/api/v1/ai/conversations/${conversationId}`)
      .set(auth(buyerToken));
    expect(detail.status).toBe(200);
    expect(detail.body.data.conversation.messages).toHaveLength(2);

    const removed = await request(app)
      .delete(`/api/v1/ai/conversations/${conversationId}`)
      .set(auth(buyerToken));
    expect(removed.status).toBe(200);
  });

  it('refuses to invent missing facts in chat answers', async () => {
    const response = await request(app)
      .post('/api/v1/ai/chat')
      .set(auth(buyerToken))
      .send({ propertyId: propertyA, message: 'What is the exact metro distance?' });

    expect(response.status).toBe(200);
    expect(response.body.data.answer).toContain('not provided');
  });

  it('compares verified metrics and saves the comparison', async () => {
    const response = await request(app)
      .post('/api/v1/ai/compare')
      .set(auth(buyerToken))
      .send({ propertyIds: [propertyA, propertyB] });

    expect(response.status).toBe(200);
    expect(response.body.data.properties).toHaveLength(2);
    expect(response.body.data.highlights.cheapest.id).toBe(propertyA);
    expect(response.body.data.highlights.largest.id).toBe(propertyB);
    expect(response.body.data.explanation).toContain('Assistant listing A');
    comparisonIds.push(response.body.data.savedComparisonId as string);

    const saved = await request(app).get('/api/v1/ai/comparisons').set(auth(buyerToken));
    expect(saved.status).toBe(200);
    expect(saved.body.data.comparisons.some((item: { id: string }) => item.id === response.body.data.savedComparisonId)).toBe(true);
  });

  it('generates grounded lead suggestions and matching listings for the owning agent', async () => {
    const summary = await request(app)
      .post('/api/v1/ai/lead-assistant')
      .set(auth(agentToken))
      .send({ leadId, task: 'SUMMARIZE' });
    expect(summary.status).toBe(200);
    expect(summary.body.data.answer).toContain('Assistant listing A');

    const questions = await request(app)
      .post('/api/v1/ai/lead-assistant')
      .set(auth(agentToken))
      .send({ leadId, task: 'QUESTIONS' });
    expect(questions.status).toBe(200);
    expect(questions.body.data.suggestions).toHaveLength(4);

    const matches = await request(app)
      .post('/api/v1/ai/lead-assistant')
      .set(auth(agentToken))
      .send({ leadId, task: 'PROPERTY_MATCH' });
    expect(matches.status).toBe(200);
    expect(matches.body.data.matches.some((item: { id: string }) => item.id === propertyA)).toBe(true);
    expect(matches.body.data.matches.some((item: { id: string }) => item.id === propertyB)).toBe(false);

    const forbidden = await request(app)
      .post('/api/v1/ai/lead-assistant')
      .set(auth(buyerToken))
      .send({ leadId, task: 'SUMMARIZE' });
    expect(forbidden.status).toBe(403);
  });
});

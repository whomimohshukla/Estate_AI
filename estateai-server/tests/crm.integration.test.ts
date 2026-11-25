import { randomUUID } from 'node:crypto';
import type { Express } from 'express';
import request from 'supertest';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/database.js';

const app: Express = createApp();
const suffix = randomUUID().slice(0, 8);
const agentEmail = `crm-agent-${suffix}@example.com`;
const buyerEmail = `crm-buyer-${suffix}@example.com`;
const password = 'Password123';
const city = `CrmCity${suffix}`;
const userIds: string[] = [];
const propertyIds: string[] = [];
const savedSearchIds: string[] = [];

const pngBuffer = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#fff' } })
  .png()
  .toBuffer();

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function register(email: string, role: 'AGENT' | 'BUYER'): Promise<string> {
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password, firstName: 'Crm', lastName: 'Tester', role });
  expect(response.status).toBe(201);
  userIds.push(response.body.data.user.id);
  return response.body.data.accessToken as string;
}

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  if (propertyIds.length) await prisma.property.deleteMany({ where: { id: { in: propertyIds } } });
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe('CRM and operations API', () => {
  let agentToken: string;
  let buyerToken: string;
  let adminToken: string;
  let propertyId: string;
  let leadId: string;
  let reportId: string;

  it('registers users and publishes a listing in an isolated city', async () => {
    agentToken = await register(agentEmail, 'AGENT');
    buyerToken = await register(buyerEmail, 'BUYER');

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@estateai.local', password });
    expect(login.status).toBe(200);
    adminToken = login.body.data.accessToken as string;

    const created = await request(app)
      .post('/api/v1/properties')
      .set(auth(agentToken))
      .send({
        title: 'CRM test apartment',
        description: 'A verified apartment with parking and gym for CRM workflow tests.',
        propertyType: 'APARTMENT',
        purpose: 'SALE',
        price: 5_000_000,
        bedrooms: 2,
        bathrooms: 2,
        areaSqFt: 1000,
        amenities: ['PARKING', 'GYM'],
        furnishing: 'SEMI_FURNISHED',
        parking: true,
        address: '1 CRM Street',
        locality: 'Central',
        city,
        state: 'Test State',
        country: 'India',
        postalCode: '100001',
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
  });

  it('saves searches and notifies buyers when a matching listing is approved', async () => {
    const saved = await request(app)
      .post('/api/v1/saved-searches')
      .set(auth(buyerToken))
      .send({
        name: 'CRM city alert',
        query: `apartment in ${city}`,
        filters: { city, purpose: 'SALE', maxPrice: 6_000_000 },
        notify: true,
      });
    expect(saved.status).toBe(201);
    savedSearchIds.push(saved.body.data.savedSearch.id as string);

    const approved = await request(app)
      .patch(`/api/v1/admin/properties/${propertyId}/approve`)
      .set(auth(adminToken));
    expect(approved.status).toBe(200);

    const notifications = await request(app).get('/api/v1/notifications').set(auth(buyerToken));
    expect(notifications.status).toBe(200);
    expect(
      notifications.body.data.notifications.some(
        (item: { type: string; data: { propertyId?: string } }) =>
          item.type === 'SAVED_SEARCH_MATCH' && item.data?.propertyId === propertyId,
      ),
    ).toBe(true);
  });

  it('manages favorites and records AI search history', async () => {
    const added = await request(app).post(`/api/v1/favorites/${propertyId}`).set(auth(buyerToken));
    expect(added.status).toBe(201);

    const checked = await request(app).get(`/api/v1/favorites/${propertyId}`).set(auth(buyerToken));
    expect(checked.status).toBe(200);
    expect(checked.body.data.isFavorite).toBe(true);

    const listed = await request(app).get('/api/v1/favorites').set(auth(buyerToken));
    expect(listed.status).toBe(200);
    expect(listed.body.data.properties.some((item: { id: string }) => item.id === propertyId)).toBe(true);

    const searched = await request(app)
      .post('/api/v1/ai/search')
      .set(auth(buyerToken))
      .send({ query: `2BHK apartment in ${city} under 60 lakh` });
    expect(searched.status).toBe(200);

    const history = await request(app).get('/api/v1/saved-searches/history').set(auth(buyerToken));
    expect(history.status).toBe(200);
    expect(history.body.data.history.some((item: { query: string }) => item.query.includes(city))).toBe(true);

    const removed = await request(app).delete(`/api/v1/favorites/${propertyId}`).set(auth(buyerToken));
    expect(removed.status).toBe(200);
  });

  it('updates saved searches and clears history', async () => {
    const created = await request(app)
      .post('/api/v1/saved-searches')
      .set(auth(buyerToken))
      .send({ name: 'Editable search', filters: { city }, notify: false });
    expect(created.status).toBe(201);
    const id = created.body.data.savedSearch.id as string;
    savedSearchIds.push(id);

    const updated = await request(app)
      .patch(`/api/v1/saved-searches/${id}`)
      .set(auth(buyerToken))
      .send({ name: 'Updated search', notify: true });
    expect(updated.status).toBe(200);
    expect(updated.body.data.savedSearch.name).toBe('Updated search');

    const cleared = await request(app).delete('/api/v1/saved-searches/history').set(auth(buyerToken));
    expect(cleared.status).toBe(200);
    expect(cleared.body.data.deleted).toBeGreaterThan(0);

    const deleted = await request(app).delete(`/api/v1/saved-searches/${id}`).set(auth(buyerToken));
    expect(deleted.status).toBe(200);
  });

  it('runs the lead inquiry pipeline with notifications, activities and CSV export', async () => {
    const created = await request(app)
      .post('/api/v1/leads')
      .set(auth(buyerToken))
      .send({
        propertyId,
        message: 'I am interested in this apartment and would like a site visit.',
        requirements: '2BHK with parking',
        budgetMax: 5_500_000,
      });
    expect(created.status).toBe(201);
    leadId = created.body.data.lead.id;

    const agentNotifications = await request(app).get('/api/v1/notifications').set(auth(agentToken));
    expect(agentNotifications.status).toBe(200);
    expect(
      agentNotifications.body.data.notifications.some(
        (item: { type: string; data: { leadId?: string } }) =>
          item.type === 'NEW_LEAD' && item.data?.leadId === leadId,
      ),
    ).toBe(true);

    const listed = await request(app).get('/api/v1/leads').set(auth(agentToken));
    expect(listed.status).toBe(200);
    expect(listed.body.data.leads.some((item: { id: string }) => item.id === leadId)).toBe(true);

    const updated = await request(app)
      .patch(`/api/v1/leads/${leadId}`)
      .set(auth(agentToken))
      .send({ status: 'CONTACTED' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.lead.status).toBe('CONTACTED');

    const activity = await request(app)
      .post(`/api/v1/leads/${leadId}/activities`)
      .set(auth(agentToken))
      .send({ type: 'FOLLOW_UP', notes: 'Schedule a site visit.', dueAt: new Date().toISOString() });
    expect(activity.status).toBe(201);

    const forbidden = await request(app)
      .patch(`/api/v1/leads/${leadId}`)
      .set(auth(buyerToken))
      .send({ status: 'LOST' });
    expect(forbidden.status).toBe(403);

    const csv = await request(app).get('/api/v1/leads/export').set(auth(agentToken));
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.text).toContain(leadId);
  });

  it('submits and reviews property reports', async () => {
    const created = await request(app)
      .post('/api/v1/reports')
      .set(auth(buyerToken))
      .send({ propertyId, reason: 'Listing details appear inaccurate', details: 'Please verify the amenities.' });
    if (created.status !== 201) console.log(created.body);
    expect(created.status).toBe(201);
    reportId = created.body.data.report.id;

    const listed = await request(app).get('/api/v1/reports').set(auth(adminToken));
    expect(listed.status).toBe(200);
    expect(listed.body.data.reports.some((item: { id: string }) => item.id === reportId)).toBe(true);

    const reviewed = await request(app)
      .patch(`/api/v1/reports/${reportId}`)
      .set(auth(adminToken))
      .send({ status: 'RESOLVED' });
    expect(reviewed.status).toBe(200);
    expect(reviewed.body.data.report.status).toBe('RESOLVED');
  });

  it('exposes agent and admin dashboards', async () => {
    const agentDashboard = await request(app).get('/api/v1/dashboard/agent').set(auth(agentToken));
    expect(agentDashboard.status).toBe(200);
    expect(agentDashboard.body.data.properties.total).toBeGreaterThanOrEqual(1);
    expect(agentDashboard.body.data.leads.total).toBeGreaterThanOrEqual(1);

    const adminDashboard = await request(app).get('/api/v1/dashboard/admin').set(auth(adminToken));
    expect(adminDashboard.status).toBe(200);
    expect(adminDashboard.body.data.users.byRole.BUYER).toBeGreaterThanOrEqual(1);
    expect(adminDashboard.body.data.reports.total).toBeGreaterThanOrEqual(1);

    const analytics = await request(app).get('/api/v1/dashboard/analytics').set(auth(adminToken));
    expect(analytics.status).toBe(200);
    expect(analytics.body.data.engagement.savedSearches).toBeGreaterThanOrEqual(1);

    const forbidden = await request(app).get('/api/v1/dashboard/admin').set(auth(buyerToken));
    expect(forbidden.status).toBe(403);
  });

  it('marks notifications as read', async () => {
    const count = await request(app).get('/api/v1/notifications/unread-count').set(auth(buyerToken));
    expect(count.status).toBe(200);
    expect(count.body.data.count).toBeGreaterThan(0);

    const marked = await request(app).patch('/api/v1/notifications/read-all').set(auth(buyerToken));
    expect(marked.status).toBe(200);
    expect(marked.body.data.updated).toBeGreaterThan(0);

    const after = await request(app).get('/api/v1/notifications/unread-count').set(auth(buyerToken));
    expect(after.status).toBe(200);
    expect(after.body.data.count).toBe(0);
  });
});

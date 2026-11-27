import { Prisma, type LeadStatus } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../utils/AppError.js';
import { paginationMeta } from '../../utils/pagination.js';
import { propertyRepository } from '../properties/properties.repository.js';
import type { Viewer } from '../properties/properties.service.js';
import type {
  CreateLeadInput,
  LeadActivityInput,
  LeadQueryInput,
  UpdateLeadInput,
} from './leads.schema.js';

const leadInclude = {
  property: { select: { id: true, title: true, city: true, price: true, status: true } },
  buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
  activities: { orderBy: { createdAt: 'desc' as const }, take: 5 },
} satisfies Prisma.LeadInclude;

function csvCell(value: unknown): string {
  const text = String(value ?? '');
  const prefix = /^[\t\r ]*[=+\-@]/.test(text) ? "'" : '';
  return `"${prefix}${text.replaceAll('"', '""')}"`;
}

export const leadsService = {
  async create(buyerId: string, input: CreateLeadInput) {
    const property = await propertyRepository.findById(input.propertyId);
    if (!property || property.status !== 'AVAILABLE') throw new NotFoundError('Property not found');

    const existing = await prisma.lead.findUnique({
      where: { propertyId_buyerId: { propertyId: input.propertyId, buyerId } },
    });
    if (existing) throw new ConflictError('You already submitted an inquiry for this property');

    const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
    const lead = await prisma.lead.create({
      data: {
        propertyId: input.propertyId,
        buyerId,
        agentId: property.agentId,
        message: input.message,
        requirements: input.requirements,
        budgetMax: input.budgetMax,
        source: 'PROPERTY_INQUIRY',
        activities: {
          create: { type: 'NOTE', notes: `Inquiry received: ${input.message}` },
        },
      },
      include: leadInclude,
    });

    await prisma.notification.create({
      data: {
        userId: property.agentId,
        type: 'NEW_LEAD',
        title: 'New property inquiry',
        body: `${buyer?.firstName ?? 'A buyer'} ${buyer?.lastName ?? ''} is interested in ${property.title}`,
        data: { leadId: lead.id, propertyId: property.id },
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: buyerId,
        action: 'LEAD_CREATED',
        entityType: 'LEAD',
        entityId: lead.id,
      },
    });

    return lead;
  },

  async list(viewer: Viewer, query: LeadQueryInput) {
    const where: Prisma.LeadWhereInput = {};
    if (viewer.role === 'BUYER') where.buyerId = viewer.id;
    if (viewer.role === 'AGENT') where.agentId = viewer.id;
    if (query.status) where.status = query.status;
    if (query.propertyId) where.propertyId = query.propertyId;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: leadInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return { leads, meta: paginationMeta(query, total) };
  },

  async getById(viewer: Viewer, id: string) {
    const lead = await prisma.lead.findUnique({ where: { id }, include: leadInclude });
    if (!lead) throw new NotFoundError('Lead not found');

    if (viewer.role === 'BUYER' && lead.buyerId !== viewer.id) throw new ForbiddenError('Not your lead');
    if (viewer.role === 'AGENT' && lead.agentId !== viewer.id) throw new ForbiddenError('Not your lead');

    return lead;
  },

  async update(viewer: Viewer, id: string, input: UpdateLeadInput) {
    const lead = await this.getById(viewer, id);
    if (viewer.role === 'BUYER') throw new ForbiddenError('Buyers cannot update lead pipelines');

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        status: input.status,
        requirements: input.requirements,
        budgetMax: input.budgetMax,
      },
      include: leadInclude,
    });

    if (input.status && input.status !== lead.status) {
      await prisma.leadActivity.create({
        data: {
          leadId: id,
          type: 'STATUS_CHANGE',
          notes: `Status changed from ${lead.status} to ${input.status}`,
        },
      });
      await prisma.notification.create({
        data: {
          userId: lead.buyerId,
          type: 'LEAD_STATUS_CHANGED',
          title: 'Lead status updated',
          body: `Your inquiry for ${lead.property.title} is now ${input.status.toLowerCase()}`,
          data: { leadId: id, propertyId: lead.propertyId },
        },
      });
    }

    return updated;
  },

  async addActivity(viewer: Viewer, id: string, input: LeadActivityInput) {
    const lead = await this.getById(viewer, id);
    if (viewer.role === 'BUYER') throw new ForbiddenError('Buyers cannot add lead activities');

    const activity = await prisma.leadActivity.create({
      data: {
        leadId: id,
        type: input.type,
        notes: input.notes,
        dueAt: input.dueAt,
      },
    });

    if (input.type === 'FOLLOW_UP') {
      await prisma.notification.create({
        data: {
          userId: lead.buyerId,
          type: 'FOLLOW_UP_REMINDER',
          title: 'Follow-up scheduled',
          body: `The agent scheduled a follow-up about ${lead.property.title}`,
          data: { leadId: id, propertyId: lead.propertyId, activityId: activity.id },
        },
      });
    }

    return activity;
  },

  async listActivities(viewer: Viewer, id: string) {
    await this.getById(viewer, id);
    return prisma.leadActivity.findMany({ where: { leadId: id }, orderBy: { createdAt: 'desc' } });
  },

  async updateStatus(viewer: Viewer, id: string, status: UpdateLeadInput['status']) {
    if (!status) throw new NotFoundError('Status is required');

    const lead = await this.update(viewer, id, { status });
    const activity = lead.activities.find((item) => item.type === 'STATUS_CHANGE') ?? null;
    return { lead, activity };
  },

  async addFollowUp(viewer: Viewer, id: string, input: { notes: string; dueAt?: Date }) {
    const activity = await this.addActivity(viewer, id, { type: 'FOLLOW_UP', ...input });
    const lead = await this.getById(viewer, id);
    return { lead, activity };
  },

  async exportCsv(viewer: Viewer, status?: LeadStatus): Promise<string> {
    const where: Prisma.LeadWhereInput = {};
    if (viewer.role === 'BUYER') where.buyerId = viewer.id;
    if (viewer.role === 'AGENT') where.agentId = viewer.id;
    if (status) where.status = status;

    const leads = await prisma.lead.findMany({
      where,
      include: leadInclude,
      orderBy: { createdAt: 'desc' },
    });

    const rows = [
      ['id', 'property', 'buyer', 'email', 'status', 'budgetMax', 'requirements', 'message', 'createdAt'],
      ...leads.map((lead) => [
        lead.id,
        lead.property.title,
        `${lead.buyer.firstName} ${lead.buyer.lastName}`,
        lead.buyer.email,
        lead.status,
        lead.budgetMax?.toString() ?? '',
        lead.requirements ?? '',
        lead.message,
        lead.createdAt.toISOString(),
      ]),
    ];

    return rows.map((row) => row.map(csvCell).join(',')).join('\n');
  },
};

import { createHash } from 'node:crypto';
import { NotificationType, type PropertyStatus } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/AppError.js';
import { paginationMeta } from '../../utils/pagination.js';
import { embeddingsService } from '../ai/embeddings/embeddings.service.js';
import { savedSearchesService } from '../saved-searches/saved-searches.service.js';
import { propertyRepository } from './properties.repository.js';
import { toPropertyDto, type PropertyDto } from './properties.types.js';
import type { CreatePropertyInput, PropertyQueryInput, UpdatePropertyInput } from './properties.schema.js';

export interface Viewer {
  id: string;
  role: 'BUYER' | 'AGENT' | 'ADMIN';
}

const allowedAgentTransitions: Record<PropertyStatus, PropertyStatus[]> = {
  DRAFT: ['PENDING'],
  PENDING: ['DRAFT', 'ARCHIVED'],
  AVAILABLE: ['SOLD', 'RENTED', 'ARCHIVED'],
  REJECTED: ['DRAFT', 'PENDING'],
  SOLD: ['PENDING'],
  RENTED: ['PENDING'],
  ARCHIVED: [],
};

export function requireOwnership(property: { agentId: string }, viewer: Viewer): void {
  if (viewer.role !== 'ADMIN' && property.agentId !== viewer.id) {
    throw new ForbiddenError('You can only manage your own properties');
  }
}

export async function getOwnedForManagement(id: string, viewer: Viewer) {
  const property = await getOrThrow(id);
  requireOwnership(property, viewer);
  return property;
}

async function notifyAgent(
  agentId: string,
  type: NotificationType,
  title: string,
  body: string,
  propertyId: string,
): Promise<void> {
  await prisma.notification.create({
    data: { userId: agentId, type, title, body, data: { propertyId } },
  });
}

async function getOrThrow(id: string) {
  const property = await propertyRepository.findById(id);
  if (!property) throw new NotFoundError('Property not found');
  return property;
}

async function syncEmbedding(id: string): Promise<void> {
  const property = await prisma.property.findUnique({ where: { id } });
  if (property) await embeddingsService.syncProperty(property);
}

export const propertiesService = {
  async create(agentId: string, input: CreatePropertyInput): Promise<PropertyDto> {
    const property = await propertyRepository.create(agentId, input);
    await syncEmbedding(property.id);
    const withImages = await propertyRepository.findById(property.id);
    return toPropertyDto(withImages ?? property);
  },

  async list(
    query: PropertyQueryInput,
    options: { agentId?: string; statuses?: PropertyStatus[] } = {},
  ): Promise<{ items: PropertyDto[]; meta: Record<string, unknown> }> {
    const [properties, total] = await Promise.all([
      propertyRepository.findMany(query, options),
      propertyRepository.count(query, options),
    ]);

    return {
      items: properties.map(toPropertyDto),
      meta: paginationMeta(query, total),
    };
  },

  async getById(
    id: string,
    viewer?: Viewer,
    request?: { ip?: string; userAgent?: string; skipViewTracking?: boolean },
  ): Promise<PropertyDto> {
    const property = await getOrThrow(id);
    const isPrivileged = viewer?.role === 'ADMIN' || (viewer?.role === 'AGENT' && property.agentId === viewer.id);

    if (property.status !== 'AVAILABLE' && !isPrivileged) throw new NotFoundError('Property not found');

    if (!isPrivileged && !request?.skipViewTracking) {
      const ipHash = request?.ip ? createHash('sha256').update(request.ip).digest('hex') : null;
      await prisma.$transaction([
        prisma.property.update({ where: { id }, data: { viewsCount: { increment: 1 } } }),
        prisma.propertyView.create({
          data: { propertyId: id, userId: viewer?.id ?? null, ipHash },
        }),
      ]);
    }

    const updated = await propertyRepository.findById(id);
    return toPropertyDto(updated ?? property);
  },

  async update(id: string, viewer: Viewer, input: UpdatePropertyInput): Promise<PropertyDto> {
    const property = await getOrThrow(id);
    requireOwnership(property, viewer);

    if (property.status === 'ARCHIVED') throw new BadRequestError('Archived properties cannot be edited');

    await propertyRepository.update(id, input);
    await syncEmbedding(id);
    return this.getById(id, viewer, { skipViewTracking: true });
  },

  async changeStatus(id: string, viewer: Viewer, status: PropertyStatus): Promise<PropertyDto> {
    const property = await getOrThrow(id);
    requireOwnership(property, viewer);

    if (!allowedAgentTransitions[property.status].includes(status)) {
      throw new BadRequestError(`Cannot change status from ${property.status} to ${status}`);
    }

    if (status === 'PENDING' && property.images.length === 0) {
      throw new BadRequestError('Add at least one property image before submitting for approval');
    }

    await propertyRepository.updateStatus(id, status, {
      rejectionReason: null,
      archivedAt: status === 'ARCHIVED' ? new Date() : null,
    });
    await syncEmbedding(id);

    return this.getById(id, viewer, { skipViewTracking: true });
  },

  async archive(id: string, viewer: Viewer): Promise<PropertyDto> {
    return this.changeStatus(id, viewer, 'ARCHIVED');
  },

  async approve(id: string): Promise<PropertyDto> {
    const property = await getOrThrow(id);
    if (property.status !== 'PENDING') throw new BadRequestError('Only pending listings can be approved');

    await propertyRepository.updateStatus(id, 'AVAILABLE', {
      rejectionReason: null,
      publishedAt: new Date(),
      archivedAt: null,
    });
    await syncEmbedding(id);
    await notifyAgent(
      property.agentId,
      NotificationType.PROPERTY_APPROVED,
      'Listing approved',
      `${property.title} is now visible in the marketplace`,
      property.id,
    );
    await prisma.auditLog.create({
      data: {
        action: 'PROPERTY_APPROVED',
        entityType: 'PROPERTY',
        entityId: property.id,
        metadata: { agentId: property.agentId },
      },
    });
    const published = await propertyRepository.findById(id);
    if (published) await savedSearchesService.notifyMatches(published);

    return this.getById(id, { id: property.agentId, role: 'AGENT' }, { skipViewTracking: true });
  },

  async reject(id: string, reason: string | undefined): Promise<PropertyDto> {
    const property = await getOrThrow(id);
    if (property.status !== 'PENDING') throw new BadRequestError('Only pending listings can be rejected');

    const rejectionReason = reason ?? 'Listing did not meet platform guidelines';
    await propertyRepository.updateStatus(id, 'REJECTED', { rejectionReason });
    await syncEmbedding(id);
    await notifyAgent(
      property.agentId,
      NotificationType.PROPERTY_REJECTED,
      'Listing needs attention',
      `${property.title} was rejected: ${rejectionReason}`,
      property.id,
    );
    await prisma.auditLog.create({
      data: {
        action: 'PROPERTY_REJECTED',
        entityType: 'PROPERTY',
        entityId: property.id,
        metadata: { reason: rejectionReason },
      },
    });

    return this.getById(id, { id: property.agentId, role: 'AGENT' }, { skipViewTracking: true });
  },

  async requestCorrection(id: string, reason: string | undefined): Promise<PropertyDto> {
    const property = await getOrThrow(id);
    if (property.status !== 'PENDING') throw new BadRequestError('Only pending listings can be sent for correction');

    const correctionReason = reason ?? 'Please review and update this listing';
    await propertyRepository.updateStatus(id, 'DRAFT', { rejectionReason: correctionReason });
    await syncEmbedding(id);
    await notifyAgent(
      property.agentId,
      NotificationType.PROPERTY_REJECTED,
      'Correction requested',
      `${property.title}: ${correctionReason}`,
      property.id,
    );
    await prisma.auditLog.create({
      data: {
        action: 'PROPERTY_CORRECTION_REQUESTED',
        entityType: 'PROPERTY',
        entityId: property.id,
        metadata: { reason: correctionReason },
      },
    });

    return this.getById(id, { id: property.agentId, role: 'AGENT' }, { skipViewTracking: true });
  },

  async listForAgent(agentId: string, query: PropertyQueryInput) {
    return this.list(query, { agentId });
  },

  async listForAdmin(query: PropertyQueryInput, statuses?: PropertyStatus[]) {
    return this.list(query, { statuses });
  },
};

import { createHash } from 'node:crypto';
import type { PropertyStatus } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/AppError.js';
import { paginationMeta } from '../../utils/pagination.js';
import { embeddingsService } from '../ai/embeddings/embeddings.service.js';
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

function requireOwnership(property: { agentId: string }, viewer: Viewer): void {
  if (property.agentId !== viewer.id) throw new ForbiddenError('You can only manage your own properties');
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
    request?: { ip?: string; userAgent?: string },
  ): Promise<PropertyDto> {
    const property = await getOrThrow(id);
    const isPrivileged = viewer?.role === 'ADMIN' || (viewer?.role === 'AGENT' && property.agentId === viewer.id);

    if (property.status !== 'AVAILABLE' && !isPrivileged) throw new NotFoundError('Property not found');

    if (!isPrivileged) {
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
    return this.getById(id, viewer);
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

    return this.getById(id, viewer);
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

    return this.getById(id, { id: property.agentId, role: 'AGENT' });
  },

  async reject(id: string, reason: string | undefined): Promise<PropertyDto> {
    const property = await getOrThrow(id);
    if (property.status !== 'PENDING') throw new BadRequestError('Only pending listings can be rejected');

    await propertyRepository.updateStatus(id, 'REJECTED', {
      rejectionReason: reason ?? 'Listing did not meet platform guidelines',
    });
    await syncEmbedding(id);

    return this.getById(id, { id: property.agentId, role: 'AGENT' });
  },

  async requestCorrection(id: string, reason: string | undefined): Promise<PropertyDto> {
    const property = await getOrThrow(id);
    if (property.status !== 'PENDING') throw new BadRequestError('Only pending listings can be sent for correction');

    await propertyRepository.updateStatus(id, 'DRAFT', {
      rejectionReason: reason ?? 'Please review and update this listing',
    });
    await syncEmbedding(id);

    return this.getById(id, { id: property.agentId, role: 'AGENT' });
  },

  async listForAgent(agentId: string, query: PropertyQueryInput) {
    return this.list(query, { agentId });
  },

  async listForAdmin(query: PropertyQueryInput, statuses?: PropertyStatus[]) {
    return this.list(query, { statuses });
  },
};

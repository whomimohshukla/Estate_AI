import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/AppError.js';
import { paginationMeta } from '../../utils/pagination.js';
import { propertyRepository } from '../properties/properties.repository.js';
import type { CreateReportInput, ReportQueryInput, ReviewReportInput } from './reports.schema.js';

export const reportsService = {
  async create(reporterId: string, input: CreateReportInput) {
    const property = await propertyRepository.findById(input.propertyId);
    if (!property) throw new NotFoundError('Property not found');

    const report = await prisma.propertyReport.create({
      data: {
        propertyId: input.propertyId,
        reporterId,
        reason: input.reason,
        details: input.details,
      },
      include: { property: { select: { title: true } }, reporter: { select: { firstName: true, lastName: true } } },
    });

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'SYSTEM' as const,
          title: 'Property report submitted',
          body: `${report.reporter.firstName} ${report.reporter.lastName} reported ${report.property.title}`,
          data: { reportId: report.id, propertyId: input.propertyId },
        })),
      });
    }

    return report;
  },

  async list(query: ReportQueryInput) {
    const where: Prisma.PropertyReportWhereInput = query.status ? { status: query.status } : {};
    const [reports, total] = await Promise.all([
      prisma.propertyReport.findMany({
        where,
        include: {
          property: { select: { id: true, title: true, city: true } },
          reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.propertyReport.count({ where }),
    ]);
    return { reports, meta: paginationMeta(query, total) };
  },

  async review(reviewerId: string, id: string, input: ReviewReportInput) {
    const report = await prisma.propertyReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundError('Report not found');

    return prisma.propertyReport.update({
      where: { id },
      data: { status: input.status, reviewedById: reviewerId, details: input.details ?? report.details },
    });
  },
};

import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { success } from '../../utils/api-response.js';
import { validatedQuery } from '../../utils/validated-query.js';
import { propertiesService } from '../properties/properties.service.js';
import type { PropertyQueryInput } from '../properties/properties.schema.js';
import { adminService } from './admin.service.js';
import type {
  AdminUserQueryInput,
  AdminUserRoleInput,
  AdminUserStatusInput,
  AuditLogQueryInput,
} from './admin.schema.js';

export const adminController = {
  listPending: asyncHandler(async (req: Request, res: Response) => {
    const query = validatedQuery<PropertyQueryInput>(req);
    const result = await propertiesService.listForAdmin(query, ['PENDING']);
    return success(res, result.items, 'Pending listings retrieved', 200, result.meta);
  }),

  listProperties: asyncHandler(async (req: Request, res: Response) => {
    const query = validatedQuery<PropertyQueryInput>(req);
    const result = await propertiesService.listForAdmin(query);
    return success(res, result.items, 'All listings retrieved', 200, result.meta);
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertiesService.approve(req.params.id!);
    return success(res, { property }, 'Listing approved');
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertiesService.reject(req.params.id!, (req.body as { reason?: string }).reason);
    return success(res, { property }, 'Listing rejected');
  }),

  requestCorrection: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertiesService.requestCorrection(req.params.id!, (req.body as { reason?: string }).reason);
    return success(res, { property }, 'Correction requested');
  }),

  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const { users, meta } = await adminService.listUsers(validatedQuery<AdminUserQueryInput>(req));
    return success(res, { users }, 'Users retrieved', 200, meta);
  }),

  updateUserStatus: asyncHandler(async (req: Request, res: Response) => {
    const user = await adminService.updateUserStatus(req.user!.id, req.params.id!, req.body as AdminUserStatusInput);
    return success(res, { user }, 'User status updated');
  }),

  updateUserRole: asyncHandler(async (req: Request, res: Response) => {
    const user = await adminService.updateUserRole(req.user!.id, req.params.id!, req.body as AdminUserRoleInput);
    return success(res, { user }, 'User role updated');
  }),

  listAuditLogs: asyncHandler(async (req: Request, res: Response) => {
    const { logs, meta } = await adminService.listAuditLogs(validatedQuery<AuditLogQueryInput>(req));
    return success(res, { logs }, 'Audit logs retrieved', 200, meta);
  }),
};

import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { success } from '../../utils/api-response.js';
import { validatedQuery } from '../../utils/validated-query.js';
import type { LeadActivityInput, CreateLeadInput, LeadQueryInput, UpdateLeadInput } from './leads.schema.js';
import { leadsService } from './leads.service.js';

export const leadsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const lead = await leadsService.create(req.user!.id, req.body as CreateLeadInput);
    return success(res, { lead }, 'Inquiry submitted', 201);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const viewer = { id: req.user!.id, role: req.user!.role };
    const query = validatedQuery<LeadQueryInput>(req);
    const { leads, meta } = await leadsService.list(viewer, query);
    return success(res, { leads }, 'Leads retrieved', 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const lead = await leadsService.getById({ id: req.user!.id, role: req.user!.role }, req.params.id!);
    return success(res, { lead }, 'Lead retrieved');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const lead = await leadsService.update(
      { id: req.user!.id, role: req.user!.role },
      req.params.id!,
      req.body as UpdateLeadInput,
    );
    return success(res, { lead }, 'Lead updated');
  }),

  addActivity: asyncHandler(async (req: Request, res: Response) => {
    const activity = await leadsService.addActivity(
      { id: req.user!.id, role: req.user!.role },
      req.params.id!,
      req.body as LeadActivityInput,
    );
    return success(res, { activity }, 'Lead activity recorded', 201);
  }),

  listActivities: asyncHandler(async (req: Request, res: Response) => {
    const activities = await leadsService.listActivities(
      { id: req.user!.id, role: req.user!.role },
      req.params.id!,
    );
    return success(res, { activities }, 'Lead activities retrieved');
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const result = await leadsService.updateStatus(
      { id: req.user!.id, role: req.user!.role },
      req.params.id!,
      (req.body as { status: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'NEGOTIATION' | 'CONVERTED' | 'LOST' }).status,
    );
    return success(res, result, 'Lead status updated');
  }),

  addFollowUp: asyncHandler(async (req: Request, res: Response) => {
    const result = await leadsService.addFollowUp(
      { id: req.user!.id, role: req.user!.role },
      req.params.id!,
      req.body as { notes: string; dueAt?: Date },
    );
    return success(res, result, 'Follow-up scheduled', 201);
  }),

  exportCsv: asyncHandler(async (req: Request, res: Response) => {
    const query = validatedQuery<LeadQueryInput>(req);
    const csv = await leadsService.exportCsv({ id: req.user!.id, role: req.user!.role }, query.status);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    return res.send(csv);
  }),
};

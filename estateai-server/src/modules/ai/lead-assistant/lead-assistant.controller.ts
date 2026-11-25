import type { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/async-handler.js';
import { success } from '../../../utils/api-response.js';
import type { LeadAssistantInput } from './lead-assistant.schema.js';
import { leadAssistantService } from './lead-assistant.service.js';

export const leadAssistantController = {
  assist: asyncHandler(async (req: Request, res: Response) => {
    const result = await leadAssistantService.assist(req.user!.id, req.body as LeadAssistantInput);
    return success(res, result, 'Lead suggestions generated from verified lead data');
  }),
};

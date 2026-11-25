import type { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/async-handler.js';
import { success } from '../../../utils/api-response.js';
import type { GenerateDescriptionInput } from './descriptions.schema.js';
import { descriptionsService } from './descriptions.service.js';

export const descriptionsController = {
  generate: asyncHandler(async (req: Request, res: Response) => {
    const result = await descriptionsService.generate(req.body as GenerateDescriptionInput, {
      id: req.user!.id,
      role: req.user!.role,
    });
    return success(res, { description: result }, 'Description generated for review');
  }),
};

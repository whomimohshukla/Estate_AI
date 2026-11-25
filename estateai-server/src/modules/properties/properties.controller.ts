import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { BadRequestError } from '../../utils/AppError.js';
import { success } from '../../utils/api-response.js';
import { validatedQuery } from '../../utils/validated-query.js';
import { imagesService } from '../images/images.service.js';
import type {
  CreatePropertyInput,
  PropertyQueryInput,
  UpdatePropertyInput,
} from './properties.schema.js';
import { propertiesService, type Viewer } from './properties.service.js';
import { toImageDto } from './properties.types.js';
import { propertyRepository } from './properties.repository.js';

function viewer(req: Request): Viewer {
  return { id: req.user!.id, role: req.user!.role };
}

export const propertiesController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertiesService.create(req.user!.id, req.body as CreatePropertyInput);
    return success(res, { property }, 'Property created as draft', 201);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const query = validatedQuery<PropertyQueryInput>(req);
    const result = await propertiesService.list(query);
    return success(res, result.items, 'Properties retrieved', 200, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertiesService.getById(req.params.id!, req.user as Viewer | undefined, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return success(res, { property }, 'Property retrieved');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertiesService.update(req.params.id!, viewer(req), req.body as UpdatePropertyInput);
    return success(res, { property }, 'Property updated');
  }),

  archive: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertiesService.archive(req.params.id!, viewer(req));
    return success(res, { property }, 'Property archived');
  }),

  changeStatus: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertiesService.changeStatus(
      req.params.id!,
      viewer(req),
      (req.body as { status: Parameters<typeof propertiesService.changeStatus>[2] }).status,
    );
    return success(res, { property }, 'Property status updated');
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const query = validatedQuery<PropertyQueryInput>(req);
    const result = await propertiesService.listForAgent(req.user!.id, query);
    return success(res, result.items, 'Your properties retrieved', 200, result.meta);
  }),

  uploadImage: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new BadRequestError('Image file is required');
    const image = await imagesService.upload(req.params.id!, req.file);
    return success(res, { image }, 'Image uploaded', 201);
  }),

  deleteImage: asyncHandler(async (req: Request, res: Response) => {
    await propertiesService.getById(req.params.id!, viewer(req));
    await imagesService.remove(req.params.id!, req.params.imageId!);
    return success(res, { deleted: true }, 'Image deleted');
  }),

  reorderImages: asyncHandler(async (req: Request, res: Response) => {
    await propertiesService.getById(req.params.id!, viewer(req));
    const images = await imagesService.reorder(req.params.id!, (req.body as { imageIds: string[] }).imageIds);
    return success(res, { images }, 'Image order updated');
  }),

  setCoverImage: asyncHandler(async (req: Request, res: Response) => {
    await propertiesService.getById(req.params.id!, viewer(req));
    const image = await propertyRepository.findImage(req.params.id!, req.params.imageId!);
    if (!image) throw new BadRequestError('Image not found for this property');

    await propertyRepository.setCoverImage(req.params.id!, image.id);
    return success(
      res,
      { image: toImageDto({ ...image, isCover: true, position: image.position }) },
      'Cover image updated',
    );
  }),
};

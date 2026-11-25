import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { cloudinaryClient, cloudinaryEnabled } from '../../config/cloudinary.js';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { BadRequestError, NotFoundError } from '../../utils/AppError.js';
import { propertyRepository } from '../properties/properties.repository.js';
import { toImageDto, type PropertyImageDto } from '../properties/properties.types.js';

const MAX_IMAGES = 10;

async function optimize(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new BadRequestError('Image file is invalid or corrupt');
  }
}

async function uploadToCloudinary(
  propertyId: string,
  buffer: Buffer,
): Promise<{ url: string; publicId: string }> {
  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinaryClient.uploader.upload_stream(
      { folder: `estateai/properties/${propertyId}`, resource_type: 'image' },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({ secure_url: uploadResult.secure_url, public_id: uploadResult.public_id });
      },
    );
    stream.end(buffer);
  });

  return { url: result.secure_url, publicId: result.public_id };
}

async function saveLocally(propertyId: string, buffer: Buffer): Promise<{ url: string; publicId: null }> {
  const directory = path.resolve(env.UPLOAD_DIR, 'properties', propertyId);
  await mkdir(directory, { recursive: true });

  const filename = `${randomUUID()}.webp`;
  await writeFile(path.join(directory, filename), buffer);

  return { url: `/uploads/properties/${propertyId}/${filename}`, publicId: null };
}

export const imagesService = {
  async upload(propertyId: string, file: Express.Multer.File): Promise<PropertyImageDto> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new NotFoundError('Property not found');

    const existing = await propertyRepository.findImages(propertyId);
    if (existing.length >= MAX_IMAGES) throw new BadRequestError(`A property can have at most ${MAX_IMAGES} images`);

    const optimized = await optimize(file.buffer);
    const uploaded = cloudinaryEnabled
      ? await uploadToCloudinary(propertyId, optimized)
      : await saveLocally(propertyId, optimized);

    const image = await propertyRepository.createImage(propertyId, {
      url: uploaded.url,
      publicId: uploaded.publicId ?? undefined,
      altText: property.title,
      position: existing.length,
      isCover: existing.length === 0,
    });

    return toImageDto(image);
  },

  async remove(propertyId: string, imageId: string): Promise<void> {
    const image = await propertyRepository.findImage(propertyId, imageId);
    if (!image) throw new NotFoundError('Property image not found');

    if (image.publicId && cloudinaryEnabled) {
      await cloudinaryClient.uploader.destroy(image.publicId);
    } else if (image.url.startsWith(`/uploads/properties/${propertyId}/`)) {
      const directory = path.resolve(env.UPLOAD_DIR, 'properties', propertyId);
      const filename = path.basename(image.url);
      const filePath = path.join(directory, filename);
      if (filePath.startsWith(directory)) {
        await unlink(filePath).catch((error) => logger.warn({ err: error }, 'Failed to remove local image'));
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.propertyImage.delete({ where: { id: imageId } });

      if (image.isCover) {
        const next = await tx.propertyImage.findFirst({ where: { propertyId }, orderBy: { position: 'asc' } });
        if (next) {
          await tx.propertyImage.update({ where: { id: next.id }, data: { isCover: true } });
        }
      }
    });
  },

  async reorder(propertyId: string, imageIds: string[]): Promise<PropertyImageDto[]> {
    const images = await propertyRepository.findImages(propertyId);
    const ids = new Set(images.map((image) => image.id));

    if (imageIds.length !== ids.size || imageIds.some((id) => !ids.has(id))) {
      throw new BadRequestError('imageIds must contain every image of this property exactly once');
    }

    await propertyRepository.setImageOrder(propertyId, imageIds);
    return (await propertyRepository.findImages(propertyId)).map(toImageDto);
  },
};

import { z } from 'zod';

export const descriptionTones = ['PROFESSIONAL', 'LUXURY', 'FRIENDLY', 'SEO', 'SOCIAL'] as const;

export const generateDescriptionSchema = z.object({
  propertyId: z.string().uuid(),
  tone: z.enum(descriptionTones).default('PROFESSIONAL'),
});

export const generatedDescriptionSchema = z.object({
  title: z.string().min(5).max(150),
  shortDescription: z.string().min(20).max(500),
  detailedDescription: z.string().min(50).max(4000),
  highlights: z.array(z.string().min(3).max(200)).min(1).max(10),
  seoDescription: z.string().min(20).max(500),
  socialDescription: z.string().min(20).max(1000),
  tags: z.array(z.string().min(2).max(50)).max(15),
});

export type GenerateDescriptionInput = z.infer<typeof generateDescriptionSchema>;
export type GeneratedDescription = z.infer<typeof generatedDescriptionSchema>;

import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().startsWith('/').default('/api/v1'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  GEMINI_EMBEDDING_MODEL: z.string().default('text-embedding-004'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  UPLOAD_DIR: z.string().default('./uploads'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('EstateAI <no-reply@estateai.local>'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = parsed.data;

if (env.NODE_ENV === 'production') {
  const secrets = [env.JWT_ACCESS_SECRET, env.JWT_REFRESH_SECRET];
  const placeholders = secrets.filter((secret) => secret.length < 32 || secret.includes('change-me'));

  if (placeholders.length > 0 || !env.GEMINI_API_KEY || !env.REDIS_URL) {
    throw new Error('Production requires strong JWT secrets, GEMINI_API_KEY and REDIS_URL');
  }
}

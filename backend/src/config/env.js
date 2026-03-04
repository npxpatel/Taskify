import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT:           z.string().default('8001'),
  NODE_ENV:       z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI:      z.string().min(1, 'MONGO_URI is required'),
  REDIS_URL:      z.string().default('redis://localhost:6379'),
  RABBITMQ_URL:   z.string().default('amqp://localhost:5672'),
  JWT_SECRET:     z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  EMAIL_USER:     z.string().optional(),
  EMAIL_PASS:     z.string().optional(),
  CORS_ORIGINS:   z.string().default('http://localhost:3000,http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000,
  path:     '/',
};

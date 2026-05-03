import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  BEARER_TOKEN: z.string().min(32, 'BEARER_TOKEN must be at least 32 chars'),
  DB_PATH: z.string().default('./data/coach.db'),
  STATIC_DIR: z.string().default('./dist-web'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Public origin used in OAuth discovery JSON (issuer, endpoints).
  PUBLIC_BASE_URL: z.string().url().default('https://coach-claude.fly.dev'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

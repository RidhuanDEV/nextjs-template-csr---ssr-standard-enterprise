import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3001/api'),
  NEXT_PUBLIC_APP_NAME: z.string().default('App'),
});

function createEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    console.error('Invalid environment variables:', errors);
    throw new Error('Invalid environment variables. Check .env.local file.');
  }

  return parsed.data;
}

export const env = createEnv();

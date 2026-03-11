import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_NAME: z.string().default("App"),
});

function createEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    console.error("Invalid environment variables:", errors);
    throw new Error("Invalid environment variables. Check .env file.");
  }

  return parsed.data;
}

export const env = createEnv();

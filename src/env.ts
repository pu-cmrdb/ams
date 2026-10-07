import { createEnv } from '@t3-oss/env-nextjs';

import { z } from '@/lib/zod';

export const env = createEnv({
  client: {
    NEXT_PUBLIC_BETTER_AUTH_IAM_URL: z.string().url().min(1),
  },
  emptyStringAsUndefined: true,
  runtimeEnv: {
    APP_URL:
      process.env.NODE_ENV === 'production'
        ? process.env.APP_PROD_URL
        : process.env.APP_DEV_URL,
    BETTER_AUTH_IAM_API_KEY: process.env.BETTER_AUTH_IAM_API_KEY,
    BETTER_AUTH_IAM_CLIENT_ID: process.env.BETTER_AUTH_IAM_CLIENT_ID,
    BETTER_AUTH_IAM_CLIENT_SECRET: process.env.BETTER_AUTH_IAM_CLIENT_SECRET,
    BETTER_AUTH_IAM_URL: process.env.BETTER_AUTH_IAM_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL:
      process.env.NODE_ENV === 'production'
        ? process.env.APP_PROD_URL
        : process.env.APP_DEV_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_BETTER_AUTH_IAM_URL:
      process.env.NEXT_PUBLIC_BETTER_AUTH_IAM_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
  server: {
    APP_URL: z.url().min(1),
    BETTER_AUTH_IAM_API_KEY: z.string().min(1),
    BETTER_AUTH_IAM_CLIENT_ID: z.string().min(1),
    BETTER_AUTH_IAM_CLIENT_SECRET: z.string().min(1),
    BETTER_AUTH_IAM_URL: z.url().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url().min(1),
    DATABASE_URL: z.url().min(1),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

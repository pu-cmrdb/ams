import { ParseError, type } from 'arktype';
import { createEnv } from '@t3-oss/env-nextjs';

export const env = createEnv({
  emptyStringAsUndefined: true,
  onInvalidAccess: (variable) => {
    throw new Error(
      `❌ 嘗試在用戶端存取伺服器端 \`${variable}\` 環境變數`,
    );
  },
  onValidationError: (issues) => {
    const errorMessage = [
      '❌ 環境變數驗證失敗',
      '',
      '錯誤詳情：',
      ...issues.map((v) => v.message),
      '',
      '請檢查你的 .env 檔案或環境變數設定。',
    ].join('\n');

    console.error(errorMessage);
    throw new ParseError(errorMessage);
  },
  runtimeEnv: {
    APP_URL: process.env.NODE_ENV === 'production' ? process.env.APP_PROD_URL : process.env.APP_DEV_URL,
    BETTER_AUTH_IAM_CLIENT_ID: process.env.BETTER_AUTH_IAM_CLIENT_ID,
    BETTER_AUTH_IAM_CLIENT_SECRET: process.env.BETTER_AUTH_IAM_CLIENT_SECRET,
    BETTER_AUTH_IAM_URL: process.env.BETTER_AUTH_IAM_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.NODE_ENV === 'production' ? process.env.APP_PROD_URL : process.env.APP_DEV_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
  server: {
    APP_URL: type('string.url > 0'),
    BETTER_AUTH_IAM_API_KEY: type('string > 0'),
    BETTER_AUTH_IAM_CLIENT_ID: type('string > 0'),
    BETTER_AUTH_IAM_CLIENT_SECRET: type('string > 0'),
    BETTER_AUTH_IAM_URL: type('string.url > 0'),
    BETTER_AUTH_SECRET: type('string > 0'),
    BETTER_AUTH_URL: type('string.url > 0'),
    DATABASE_URL: type('string.url > 0'),
    NODE_ENV: type('"development" | "test" | "production" | undefined').pipe((v) => v ?? 'development'),
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

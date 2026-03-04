import { betterAuth } from 'better-auth';
import { genericOAuth } from 'better-auth/plugins/generic-oauth';

import { env } from '@/env';

export const auth = betterAuth({
  appName: '行雲資產管理系統',
  baseURL: env.BETTER_AUTH_URL,
  plugins: [
    genericOAuth({
      config: [
        {
          clientId: env.BETTER_AUTH_IAM_CLIENT_ID,
          clientSecret: env.BETTER_AUTH_IAM_CLIENT_SECRET,
          discoveryUrl: `${env.BETTER_AUTH_IAM_URL}/.well-known/openid-configuration`,
          pkce: true,
          providerId: 'identity',
          scopes: ['openid', 'profile', 'email', 'offline_access'],
        },
      ],
    }),
  ],
  trustedOrigins: [
    'http://localhost:*',
    'https://*.cmrdb.cs.pu.edu.tw',
  ],
});

export type Session = typeof auth.$Infer.Session;

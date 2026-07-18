import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { db } from './db/client.js'
import * as schema from './db/schema.js'
import { env } from './config/env.js'

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.CLIENT_URL],
  advanced: {
    defaultCookieAttributes:
      env.NODE_ENV === 'production'
        ? {
            sameSite: 'none',
            secure: true,
          }
        : undefined,
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
})

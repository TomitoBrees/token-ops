import dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

dotenv.config({ path: '.env.local' })

/** Drizzle Kit introspection fails on Supabase transaction pooler (port 6543). */
function getDrizzleKitDatabaseUrl() {
  const url = process.env.DATABASE_URL_MIGRATE ?? process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url.replace(':6543', ':5432')
}

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: {
    url: getDrizzleKitDatabaseUrl(),
  },
})

import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres, { type Sql } from 'postgres'

import * as schema from '../drizzle/schema'
import {
  companyBudgets,
  companyUsageDaily,
  companyUsageOverview,
  usageEvents,
} from '../drizzle/schema'

const COMPANY_ID = 'a333ded6-46d6-44e7-8566-82ecff4c632d'
const PROFILE_ID = '1378b6d3-764c-4e9f-bb3a-e5f7409ba2bd'
const COMPANY_MEMBER_ID = '804b286e-5872-4e1d-aa69-a9bea99e2c76'

const TREND_DAYS = 60

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

function daysAgoUTC(days: number) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

function generateDailyUsageTrend(dayCount: number) {
  return Array.from({ length: dayCount }, (_, index) => {
    const daysBack = dayCount - 1 - index
    const date = daysAgoUTC(daysBack)
    const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const variation = ((index * 17 + 13) % 100) / 100
    const activity = isWeekend ? 0.25 + variation * 0.5 : 0.6 + variation * 0.8

    const totalCalls = Math.max(1, Math.round((2 + variation * 14) * activity))
    const tokensConsumed = Math.round(
      totalCalls * (700 + variation * 2400) +
        (isWeekend ? 0 : 400 + variation * 1200),
    )
    const totalCostUsd = (
      tokensConsumed * 0.000009 +
      totalCalls * 0.004 +
      variation * 0.015
    ).toFixed(4)

    return {
      companyId: COMPANY_ID,
      date,
      totalCalls,
      tokensConsumed,
      totalCostUsd,
    }
  })
}

const MOCK_USAGE_EVENTS = [
  {
    model: 'claude-sonnet-4',
    input_tokens: 1842,
    output_tokens: 956,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 512,
    estimated_cost_usd: '0.0184',
    created_at: daysAgo(1),
  },
  {
    model: 'claude-sonnet-4',
    input_tokens: 3200,
    output_tokens: 1400,
    cache_creation_input_tokens: 256,
    cache_read_input_tokens: 0,
    estimated_cost_usd: '0.0312',
    created_at: daysAgo(2),
  },
  {
    model: 'claude-haiku',
    input_tokens: 620,
    output_tokens: 180,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    estimated_cost_usd: '0.0021',
    created_at: daysAgo(3),
  },
  {
    model: 'claude-opus-4',
    input_tokens: 4100,
    output_tokens: 2200,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 1024,
    estimated_cost_usd: '0.0895',
    created_at: daysAgo(5),
  },
  {
    model: 'claude-sonnet-4',
    input_tokens: 980,
    output_tokens: 420,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 256,
    estimated_cost_usd: '0.0098',
    created_at: daysAgo(7),
  },
  {
    model: 'claude-haiku',
    input_tokens: 450,
    output_tokens: 120,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 128,
    estimated_cost_usd: '0.0014',
    created_at: daysAgo(9),
  },
  {
    model: 'claude-sonnet-4',
    input_tokens: 2100,
    output_tokens: 890,
    cache_creation_input_tokens: 128,
    cache_read_input_tokens: 384,
    estimated_cost_usd: '0.0226',
    created_at: daysAgo(12),
  },
  {
    model: 'claude-opus-4',
    input_tokens: 5600,
    output_tokens: 3100,
    cache_creation_input_tokens: 512,
    cache_read_input_tokens: 0,
    estimated_cost_usd: '0.1120',
    created_at: daysAgo(14),
  },
] as const

function tokensConsumed(event: (typeof MOCK_USAGE_EVENTS)[number]) {
  return (
    event.input_tokens +
    event.output_tokens +
    event.cache_creation_input_tokens +
    event.cache_read_input_tokens
  )
}

async function ensureUsageDailyTable(client: Sql) {
  await client.unsafe(`
    CREATE TABLE IF NOT EXISTS "company_usage_daily" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "company_id" uuid,
      "date" date NOT NULL,
      "total_calls" integer DEFAULT 0 NOT NULL,
      "tokens_consumed" integer DEFAULT 0 NOT NULL,
      "total_cost_usd" numeric DEFAULT '0' NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "company_usage_daily_company_date_unique" UNIQUE("company_id","date")
    );

    DO $$ BEGIN
      ALTER TABLE "company_usage_daily"
        ADD CONSTRAINT "company_usage_daily_company_id_companies_id_fk"
        FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id")
        ON DELETE no action ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in .env.local')
  }

  const client = postgres(connectionString, { prepare: false })
  const db = drizzle(client, { schema })

  await ensureUsageDailyTable(client)

  console.log('Clearing existing seed data...')
  await db
    .delete(usageEvents)
    .where(eq(usageEvents.company_member_id, COMPANY_MEMBER_ID))
  await db
    .delete(companyBudgets)
    .where(eq(companyBudgets.companyId, COMPANY_ID))
  await db
    .delete(companyUsageOverview)
    .where(eq(companyUsageOverview.companyId, COMPANY_ID))
  await db
    .delete(companyUsageDaily)
    .where(eq(companyUsageDaily.companyId, COMPANY_ID))

  console.log('Seeding usage_events...')

  const insertedEvents = await db
    .insert(usageEvents)
    .values(
      MOCK_USAGE_EVENTS.map((event) => ({
        company_member_id: COMPANY_MEMBER_ID,
        ...event,
      })),
    )
    .returning({ id: usageEvents.id })

  const totalCalls = insertedEvents.length
  const totalTokens = MOCK_USAGE_EVENTS.reduce(
    (sum, event) => sum + tokensConsumed(event),
    0,
  )
  const totalCostUsd = MOCK_USAGE_EVENTS.reduce(
    (sum, event) => sum + Number(event.estimated_cost_usd),
    0,
  ).toFixed(4)

  console.log('Seeding company_usage_overview...')
  await db
    .insert(companyUsageOverview)
    .values({
      companyId: COMPANY_ID,
      totalCalls,
      tokensConsumed: totalTokens,
      totalCostUsd,
    })
    .onConflictDoUpdate({
      target: companyUsageOverview.companyId,
      set: {
        totalCalls,
        tokensConsumed: totalTokens,
        totalCostUsd,
        updatedAt: new Date(),
      },
    })

  const dailyTrend = generateDailyUsageTrend(TREND_DAYS)

  console.log(`Seeding company_usage_daily (${TREND_DAYS} days)...`)
  await db
    .insert(companyUsageDaily)
    .values(dailyTrend)
    .onConflictDoUpdate({
      target: [companyUsageDaily.companyId, companyUsageDaily.date],
      set: {
        totalCalls: sql`excluded.total_calls`,
        tokensConsumed: sql`excluded.tokens_consumed`,
        totalCostUsd: sql`excluded.total_cost_usd`,
        updatedAt: new Date(),
      },
    })

  console.log('Seeding company_budgets...')
  await db
    .insert(companyBudgets)
    .values([
      { companyId: COMPANY_ID, month: 5, year: 2026, budget: 50_000 },
      { companyId: COMPANY_ID, month: 6, year: 2026, budget: 75_000 },
      { companyId: COMPANY_ID, month: 7, year: 2026, budget: 100_000 },
    ])
    .onConflictDoUpdate({
      target: [
        companyBudgets.companyId,
        companyBudgets.month,
        companyBudgets.year,
      ],
      set: { budget: sql`excluded.budget` },
    })

  console.log('Seed complete.')
  console.log({
    companyId: COMPANY_ID,
    profileId: PROFILE_ID,
    companyMemberId: COMPANY_MEMBER_ID,
    usageEvents: totalCalls,
    tokensConsumed: totalTokens,
    totalCostUsd,
    usageTrendDays: TREND_DAYS,
    usageTrendRange: `${dailyTrend[0].date} → ${dailyTrend.at(-1)?.date}`,
    budgets: 'May–Jul 2026',
  })

  await client.end()
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})

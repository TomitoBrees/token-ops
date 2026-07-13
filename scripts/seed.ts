import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres, { type Sql } from 'postgres'

import * as schema from '../drizzle/schema'
import {
  companyBudgets,
  companyMembers,
  companyUsageDaily,
  companyUsageOverview,
  memberUsageDaily,
  modelUsageDaily,
  profiles,
  usageEvents,
} from '../drizzle/schema'
import type { MemberRole } from '../drizzle/schema'

const COMPANY_ID = 'a333ded6-46d6-44e7-8566-82ecff4c632d'
const PROFILE_ID = '1378b6d3-764c-4e9f-bb3a-e5f7409ba2bd'
const COMPANY_MEMBER_ID = '804b286e-5872-4e1d-aa69-a9bea99e2c76'

const TREND_DAYS = 60
const SEED_PASSWORD = 'MockSeed2026!'

const MOCK_TEAM = [
  {
    email: 'seed-mock+alice@token-ops.dev',
    displayName: 'Alice Chen',
    role: 'developer' as MemberRole,
    activity: 1.45,
  },
  {
    email: 'seed-mock+emma@token-ops.dev',
    displayName: 'Emma Laurent',
    role: 'developer' as MemberRole,
    activity: 1.3,
  },
  {
    email: 'seed-mock+bob@token-ops.dev',
    displayName: 'Bob Martinez',
    role: 'developer' as MemberRole,
    activity: 1.05,
  },
  {
    email: 'seed-mock+carla@token-ops.dev',
    displayName: 'Carla Okonkwo',
    role: 'developer' as MemberRole,
    activity: 0.85,
  },
  {
    email: 'seed-mock+frank@token-ops.dev',
    displayName: 'Frank Weber',
    role: 'developer' as MemberRole,
    activity: 0.65,
  },
  {
    email: 'seed-mock+diego@token-ops.dev',
    displayName: 'Diego Rossi',
    role: 'viewer' as MemberRole,
    activity: 0.35,
  },
] as const

const MOCK_MODELS = [
  {
    model: 'claude-sonnet-4',
    activity: 1.15,
    costMultiplier: 1,
    tokensPerCall: 2200,
  },
  {
    model: 'claude-opus-4',
    activity: 0.42,
    costMultiplier: 3.8,
    tokensPerCall: 4800,
  },
  {
    model: 'claude-haiku',
    activity: 1.35,
    costMultiplier: 0.22,
    tokensPerCall: 650,
  },
] as const

type SeedMember = {
  companyMemberId: string
  displayName: string
  email: string
  activity: number
}

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

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!url || !secretKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local',
    )
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
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

function generateMemberDailyUsage(members: SeedMember[], dayCount: number) {
  return members.flatMap((member, memberIndex) =>
    Array.from({ length: dayCount }, (_, index) => {
      const daysBack = dayCount - 1 - index
      const date = daysAgoUTC(daysBack)
      const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const variation = ((index * 19 + memberIndex * 11 + 7) % 100) / 100
      const activity = isWeekend
        ? 0.2 + variation * 0.45
        : 0.55 + variation * 0.75

      const totalCalls = Math.max(
        0,
        Math.round((1 + variation * 10) * activity * member.activity),
      )

      if (totalCalls === 0) {
        return null
      }

      const tokensConsumed = Math.round(
        totalCalls * (600 + variation * 2000) +
          (isWeekend ? 0 : 250 + variation * 900),
      )
      const totalCostUsd = (
        tokensConsumed * 0.000009 +
        totalCalls * 0.0035 +
        variation * 0.012 * member.activity
      ).toFixed(4)

      return {
        companyMemberId: member.companyMemberId,
        companyId: COMPANY_ID,
        date,
        totalCalls,
        tokensConsumed,
        totalCostUsd,
      }
    }).filter((row) => row !== null),
  )
}

function generateModelDailyUsage(dayCount: number) {
  return MOCK_MODELS.flatMap((mockModel, modelIndex) =>
    Array.from({ length: dayCount }, (_, index) => {
      const daysBack = dayCount - 1 - index
      const date = daysAgoUTC(daysBack)
      const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const variation = ((index * 23 + modelIndex * 9 + 5) % 100) / 100
      const activity = isWeekend
        ? 0.22 + variation * 0.42
        : 0.58 + variation * 0.72

      const totalCalls = Math.max(
        1,
        Math.round(
          (1 + variation * 8) * activity * mockModel.activity,
        ),
      )
      const tokensConsumed = Math.round(
        totalCalls * mockModel.tokensPerCall * (0.85 + variation * 0.35),
      )
      const totalCostUsd = (
        tokensConsumed * 0.000009 * mockModel.costMultiplier +
        totalCalls * 0.004 * mockModel.costMultiplier +
        variation * 0.01
      ).toFixed(4)

      return {
        companyId: COMPANY_ID,
        model: mockModel.model,
        date,
        totalCalls,
        tokensConsumed,
        totalCostUsd,
      }
    }),
  )
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

async function ensureMemberUsageDailyTable(client: Sql) {
  await client.unsafe(`
    CREATE TABLE IF NOT EXISTS "member_usage_daily" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "company_member_id" uuid,
      "company_id" uuid,
      "date" date NOT NULL,
      "total_calls" integer DEFAULT 0 NOT NULL,
      "tokens_consumed" integer DEFAULT 0 NOT NULL,
      "total_cost_usd" numeric DEFAULT '0' NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "member_usage_daily_member_date_unique" UNIQUE("company_member_id","date")
    );

    DO $$ BEGIN
      ALTER TABLE "member_usage_daily"
        ADD CONSTRAINT "member_usage_daily_company_member_id_company_members_id_fk"
        FOREIGN KEY ("company_member_id") REFERENCES "public"."company_members"("id")
        ON DELETE no action ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "member_usage_daily"
        ADD CONSTRAINT "member_usage_daily_company_id_companies_id_fk"
        FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id")
        ON DELETE no action ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "member_usage_daily_company_date_idx"
      ON "member_usage_daily" ("company_id", "date");
  `)
}

async function ensureModelUsageDailyTable(client: Sql) {
  await client.unsafe(`
    CREATE TABLE IF NOT EXISTS "model_usage_daily" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "company_id" uuid,
      "model" text NOT NULL,
      "date" date NOT NULL,
      "total_calls" integer DEFAULT 0 NOT NULL,
      "tokens_consumed" integer DEFAULT 0 NOT NULL,
      "total_cost_usd" numeric DEFAULT '0' NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "company_model_usage_daily_company_model_date_unique" UNIQUE("company_id","model","date")
    );

    DO $$ BEGIN
      ALTER TABLE "model_usage_daily"
        ADD CONSTRAINT "model_usage_daily_company_id_companies_id_fk"
        FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id")
        ON DELETE no action ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "company_model_usage_daily_company_date_idx"
      ON "model_usage_daily" ("company_id", "date");
  `)
}

async function findAuthUserByEmail(
  supabase: SupabaseClient,
  email: string,
) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (error) {
    throw error
  }

  return data.users.find((user) => user.email === email) ?? null
}

async function cleanupSeedMembers(
  db: ReturnType<typeof drizzle>,
  supabase: SupabaseClient,
) {
  const seedEmails = MOCK_TEAM.map((member) => member.email)

  await db
    .delete(memberUsageDaily)
    .where(eq(memberUsageDaily.companyId, COMPANY_ID))
  await db
    .delete(modelUsageDaily)
    .where(eq(modelUsageDaily.companyId, COMPANY_ID))

  const seedProfiles = await db
    .select({ id: profiles.id, email: profiles.email })
    .from(profiles)
    .where(inArray(profiles.email, seedEmails))

  if (seedProfiles.length > 0) {
    await db
      .delete(companyMembers)
      .where(
        and(
          eq(companyMembers.companyId, COMPANY_ID),
          inArray(
            companyMembers.userId,
            seedProfiles.map((profile) => profile.id),
          ),
        ),
      )
  }

  for (const email of seedEmails) {
    const user = await findAuthUserByEmail(supabase, email)
    if (!user) continue

    const { error } = await supabase.auth.admin.deleteUser(user.id)
    if (error) {
      throw error
    }
  }
}

async function ensureSeedMember(
  db: ReturnType<typeof drizzle>,
  supabase: SupabaseClient,
  member: (typeof MOCK_TEAM)[number],
) {
  let user = await findAuthUserByEmail(supabase, member.email)

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: member.email,
      password: SEED_PASSWORD,
      email_confirm: true,
    })

    if (error) {
      throw error
    }

    user = data.user
  }

  await db
    .update(profiles)
    .set({ displayName: member.displayName })
    .where(eq(profiles.id, user.id))

  const existingMembership = await db.query.companyMembers.findFirst({
    where: and(
      eq(companyMembers.userId, user.id),
      eq(companyMembers.companyId, COMPANY_ID),
    ),
  })

  if (existingMembership) {
    return {
      companyMemberId: existingMembership.id,
      displayName: member.displayName,
      email: member.email,
      activity: member.activity,
    }
  }

  const [membership] = await db
    .insert(companyMembers)
    .values({
      userId: user.id,
      companyId: COMPANY_ID,
      role: member.role,
    })
    .returning({ id: companyMembers.id })

  return {
    companyMemberId: membership.id,
    displayName: member.displayName,
    email: member.email,
    activity: member.activity,
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in .env.local')
  }

  const supabase = createSupabaseAdmin()
  const client = postgres(connectionString, { prepare: false })
  const db = drizzle(client, { schema })

  await ensureUsageDailyTable(client)
  await ensureMemberUsageDailyTable(client)
  await ensureModelUsageDailyTable(client)

  console.log('Clearing existing seed data...')
  await cleanupSeedMembers(db, supabase)

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

  console.log('Creating mock company members...')
  const seededMembers = await Promise.all(
    MOCK_TEAM.map((member) => ensureSeedMember(db, supabase, member)),
  )

  const ownerProfile = await db.query.profiles.findFirst({
    where: eq(profiles.id, PROFILE_ID),
  })

  const allMembers: SeedMember[] = [
    {
      companyMemberId: COMPANY_MEMBER_ID,
      displayName: ownerProfile?.displayName ?? 'You',
      email: ownerProfile?.email ?? 'owner@token-ops.dev',
      activity: 0.95,
    },
    ...seededMembers,
  ]

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
  const memberDailyUsage = generateMemberDailyUsage(allMembers, TREND_DAYS)
  const modelDailyUsage = generateModelDailyUsage(TREND_DAYS)

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

  console.log(
    `Seeding member_usage_daily (${TREND_DAYS} days, ${allMembers.length} members)...`,
  )
  await db
    .insert(memberUsageDaily)
    .values(memberDailyUsage)
    .onConflictDoUpdate({
      target: [memberUsageDaily.companyMemberId, memberUsageDaily.date],
      set: {
        totalCalls: sql`excluded.total_calls`,
        tokensConsumed: sql`excluded.tokens_consumed`,
        totalCostUsd: sql`excluded.total_cost_usd`,
        updatedAt: new Date(),
      },
    })

  console.log(
    `Seeding model_usage_daily (${TREND_DAYS} days, ${MOCK_MODELS.length} models)...`,
  )
  await db
    .insert(modelUsageDaily)
    .values(modelDailyUsage)
    .onConflictDoUpdate({
      target: [
        modelUsageDaily.companyId,
        modelUsageDaily.model,
        modelUsageDaily.date,
      ],
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
    memberUsageRows: memberDailyUsage.length,
    modelUsageRows: modelDailyUsage.length,
    models: MOCK_MODELS.map((mockModel) => mockModel.model).join(', '),
    topMembers: allMembers
      .map((member) => member.displayName)
      .join(', '),
    mockMemberPassword: SEED_PASSWORD,
    budgets: 'May–Jul 2026',
  })

  await client.end()
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})

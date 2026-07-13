import { relations } from 'drizzle-orm'
import {
	pgSchema,
	pgTable,
	pgEnum,
	text,
	timestamp,
	uuid,
	unique,
	index,
	integer,
	numeric,
	date,
} from 'drizzle-orm/pg-core'

const authSchema = pgSchema('auth')

/** Read-only reference — managed by Supabase Auth, not Drizzle migrations */
export const authUsers = authSchema.table('users', {
	id: uuid('id').primaryKey(),
})

/* PROFILES */

export const profiles = pgTable(
	'profiles',
	{
		id: uuid('id')
			.primaryKey()
			.references(() => authUsers.id, { onDelete: 'cascade' }),
		email: text('email'),
		displayName: text('display_name'),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [index('profiles_email_idx').on(table.email)],
)

/* COMPANIES */

export const companies = pgTable('companies', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	size: integer('size'),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
})

export const companyBudgets = pgTable(
	'company_budgets',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		companyId: uuid('company_id')
			.references(() => companies.id)
			.notNull(),
		month: integer('month').notNull(),
		year: integer('year').notNull(),
		budget: integer('budget').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		unique('company_budgets_company_month_year_unique').on(
			table.companyId,
			table.month,
			table.year,
		),
	],
)

/* COMPANY MEMBERS */
export const MEMBER_ROLES = ['owner', 'developer', 'viewer'] as const
export type MemberRole = (typeof MEMBER_ROLES)[number]

export const roleEnum = pgEnum('member_role', MEMBER_ROLES)

export const companyMembers = pgTable(
	'company_members',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').references(() => profiles.id),
		companyId: uuid('company_id').references(() => companies.id),
		role: roleEnum().notNull().default('developer'),
		proxy_token: uuid('proxy_token'),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		unique('company_members_user_company_unique').on(
			table.userId,
			table.companyId,
		),
		unique('company_members_proxy_token_unique').on(table.proxy_token),
		index('company_members_company_id_idx').on(table.companyId),
		index('company_members_user_id_idx').on(table.userId),
		index('company_members_proxy_token_idx').on(table.proxy_token),
	],
)

/* INVITATIONS */

export const inviteStatusEnum = pgEnum('status', [
	'pending',
	'accepted',
	'revoked',
])

export const companyInvitations = pgTable(
	'company_invitations',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		company_id: uuid('company_id').references(() => companies.id),
		email: text('email').notNull(),
		role: roleEnum().notNull(),
		status: inviteStatusEnum().notNull().default('pending'),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		unique('company_invitations_company_email_unique').on(
			table.company_id,
			table.email,
		),
		index('company_invitations_company_id_idx').on(table.company_id),
		index('company_invitations_status_idx').on(table.status),
	],
)

/* TOKEN USAGE */
export const usageEvents = pgTable(
	'usage_events',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		company_member_id: uuid('company_member_id')
			.references(() => companyMembers.id)
			.notNull(),
		model: text('model'),
		input_tokens: integer('input_tokens').notNull().default(0),
		output_tokens: integer('output_tokens').notNull().default(0),
		cache_creation_input_tokens: integer('cache_creation_input_tokens')
			.notNull()
			.default(0),
		cache_read_input_tokens: integer('cache_read_input_tokens')
			.notNull()
			.default(0),
		estimated_cost_usd: numeric(),
		created_at: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index('usage_events_company_member_created_at_idx').on(
			table.company_member_id,
			table.created_at,
		),
		index('usage_events_created_at_idx').on(table.created_at),
		index('usage_events_model_idx').on(table.model),
	],
)

export const companyUsageOverview = pgTable(
	'company_usage_overview',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		companyId: uuid('company_id').references(() => companies.id),
		totalCalls: integer('total_calls').notNull().default(0),
		tokensConsumed: integer('tokens_consumed').notNull().default(0),
		totalCostUsd: numeric('total_cost_usd').notNull().default('0'),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		unique('company_usage_overview_company_id_unique').on(table.companyId),
	],
)

export const companyUsageDaily = pgTable(
	'company_usage_daily',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		companyId: uuid('company_id').references(() => companies.id),
		date: date('date').notNull(),
		totalCalls: integer('total_calls').notNull().default(0),
		tokensConsumed: integer('tokens_consumed').notNull().default(0),
		totalCostUsd: numeric('total_cost_usd').notNull().default('0'),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		unique('company_usage_daily_company_date_unique').on(
			table.companyId,
			table.date,
		),
	],
)

export const memberUsageDaily = pgTable(
	'member_usage_daily',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		companyMemberId: uuid('company_member_id').references(
			() => companyMembers.id,
		),
		companyId: uuid('company_id').references(() => companies.id),
		date: date('date').notNull(),
		totalCalls: integer('total_calls').notNull().default(0),
		tokensConsumed: integer('tokens_consumed').notNull().default(0),
		totalCostUsd: numeric('total_cost_usd').notNull().default('0'),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		unique('member_usage_daily_member_date_unique').on(
			table.companyMemberId,
			table.date,
		),
		index('member_usage_daily_company_date_idx').on(
			table.companyId,
			table.date,
		),
	],
)

export const modelUsageDaily = pgTable(
	'model_usage_daily',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		companyId: uuid('company_id').references(() => companies.id),
		model: text('model').notNull(),
		date: date('date').notNull(),
		totalCalls: integer('total_calls').notNull().default(0),
		tokensConsumed: integer('tokens_consumed').notNull().default(0),
		totalCostUsd: numeric('total_cost_usd').notNull().default('0'),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		unique('company_model_usage_daily_company_model_date_unique').on(
			table.companyId,
			table.model,
			table.date,
		),
		index('company_model_usage_daily_company_date_idx').on(
			table.companyId,
			table.date,
		),
	],
)

/* RELATIONS */

export const profilesRelations = relations(profiles, ({ many }) => ({
	companyMembers: many(companyMembers),
}))

export const companiesRelations = relations(companies, ({ many }) => ({
	members: many(companyMembers),
}))

export const companyMembersRelations = relations(
	companyMembers,
	({ one, many }) => ({
		company: one(companies, {
			fields: [companyMembers.companyId],
			references: [companies.id],
		}),
		profile: one(profiles, {
			fields: [companyMembers.userId],
			references: [profiles.id],
		}),
		usageEvents: many(usageEvents),
	}),
)

export const usageEventsRelations = relations(usageEvents, ({ one }) => ({
	companyMember: one(companyMembers, {
		fields: [usageEvents.company_member_id],
		references: [companyMembers.id],
	}),
}))

export const companyUsageOverviewRelations = relations(
	companyUsageOverview,
	({ one }) => ({
		company: one(companies, {
			fields: [companyUsageOverview.companyId],
			references: [companies.id],
		}),
	}),
)

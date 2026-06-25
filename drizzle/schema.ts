import { relations } from 'drizzle-orm'
import { pgSchema, pgTable, pgEnum, text, timestamp, uuid, unique, integer } from 'drizzle-orm/pg-core'

const authSchema = pgSchema('auth')

/** Read-only reference — managed by Supabase Auth, not Drizzle migrations */
export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

/* PROFILES */

export const profiles = pgTable('profiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  email: text('email'),
  displayName: text('display_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});


/* COMPANIES */

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom()  ,
  name: text('name').notNull(),
  size: integer('size'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}) ;

/* COMPANY MEMBERS */
export const MEMBER_ROLES = ['owner', 'developer', 'viewer'] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const roleEnum = pgEnum('member_role', MEMBER_ROLES);

export const companyMembers = pgTable('company_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id),
  companyId: uuid('company_id').references(() => companies.id),
  role: roleEnum().notNull().default("developer"),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique('company_members_user_company_unique').on(table.userId, table.companyId),
],);


/* INVITATIONS */

export const inviteStatusEnum = pgEnum('status', ['pending', 'accepted', 'revoked']);

export const companyInvitations = pgTable('company_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').references(() => companies.id),
  email: text('email').notNull(),
  role: roleEnum().notNull(),
  status: inviteStatusEnum().notNull().default("pending"),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})


/* RELATIONS */

export const profilesRelations = relations(profiles, ({ many }) => ({
  companyMembers: many(companyMembers),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  members: many(companyMembers),
}));

export const companyMembersRelations = relations(companyMembers, ({ one }) => ({
  company: one(companies, {
    fields: [companyMembers.companyId],
    references: [companies.id],
  }),
  profile: one(profiles, {
    fields: [companyMembers.userId],
    references: [profiles.id],
  }),
}));

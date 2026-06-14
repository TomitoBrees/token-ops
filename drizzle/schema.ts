import { pgSchema, pgTable, pgEnum, text, timestamp, uuid, unique } from 'drizzle-orm/pg-core'

const authSchema = pgSchema('auth')

/** Read-only reference — managed by Supabase Auth, not Drizzle migrations */
export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  email: text('email'),
  displayName: text('display_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom()  ,
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}) ;

export const roleEnum = pgEnum('member_role', ['owner', 'developer']);

export const companyMembers = pgTable('company_members', {
  id: uuid('id').primaryKey().defaultRandom()  ,
  userId: uuid('user_id').references(() => profiles.id),
  companyId: uuid('company_id').references(() => companies.id),
  role: roleEnum().notNull().default("developer"),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique('company_members_user_company_unique').on(table.userId, table.companyId),
],);

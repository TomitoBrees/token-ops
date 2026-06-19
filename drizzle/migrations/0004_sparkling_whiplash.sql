ALTER TYPE "public"."member_role" ADD VALUE 'viewer';--> statement-breakpoint
ALTER TABLE "company_invitations" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "company_invitations" ADD COLUMN "status" "status" DEFAULT 'pending' NOT NULL;
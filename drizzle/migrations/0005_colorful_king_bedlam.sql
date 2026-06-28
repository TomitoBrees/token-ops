CREATE TABLE "usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_member_id" uuid NOT NULL,
	"model" text,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cache_creation_input_tokens" integer DEFAULT 0 NOT NULL,
	"cache_read_input_tokens" integer DEFAULT 0 NOT NULL,
	"estimated_cost_usd" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_members" ADD COLUMN "proxy_token" uuid;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_company_member_id_company_members_id_fk" FOREIGN KEY ("company_member_id") REFERENCES "public"."company_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "usage_events_company_member_created_at_idx" ON "usage_events" USING btree ("company_member_id","created_at");--> statement-breakpoint
CREATE INDEX "usage_events_created_at_idx" ON "usage_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "usage_events_model_idx" ON "usage_events" USING btree ("model");--> statement-breakpoint
CREATE INDEX "company_members_company_id_idx" ON "company_members" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_members_user_id_idx" ON "company_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "company_members_proxy_token_idx" ON "company_members" USING btree ("proxy_token");--> statement-breakpoint
CREATE INDEX "company_invitations_company_id_idx" ON "company_invitations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_invitations_status_idx" ON "company_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "profiles_email_idx" ON "profiles" USING btree ("email");--> statement-breakpoint
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_proxy_token_unique" UNIQUE("proxy_token");--> statement-breakpoint
ALTER TABLE "company_invitations" ADD CONSTRAINT "company_invitations_company_email_unique" UNIQUE("company_id","email");
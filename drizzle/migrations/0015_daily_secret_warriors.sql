CREATE TABLE "member_model_usage_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_member_id" uuid,
	"company_id" uuid,
	"model" text NOT NULL,
	"date" date NOT NULL,
	"total_calls" integer DEFAULT 0 NOT NULL,
	"tokens_consumed" integer DEFAULT 0 NOT NULL,
	"total_cost_usd" numeric DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_model_usage_daily_member_model_date_unique" UNIQUE("company_member_id","model","date")
);
--> statement-breakpoint
ALTER TABLE "model_usage_daily" RENAME TO "company_model_usage_daily";--> statement-breakpoint
ALTER TABLE "company_model_usage_daily" DROP CONSTRAINT "model_usage_daily_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "member_model_usage_daily" ADD CONSTRAINT "member_model_usage_daily_company_member_id_company_members_id_fk" FOREIGN KEY ("company_member_id") REFERENCES "public"."company_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_model_usage_daily" ADD CONSTRAINT "member_model_usage_daily_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_model_usage_daily_member_date_idx " ON "member_model_usage_daily" USING btree ("company_id","date");--> statement-breakpoint
ALTER TABLE "company_model_usage_daily" ADD CONSTRAINT "company_model_usage_daily_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
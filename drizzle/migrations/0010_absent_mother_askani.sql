CREATE TABLE "company_usage_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"date" date NOT NULL,
	"total_calls" integer DEFAULT 0 NOT NULL,
	"tokens_consumed" integer DEFAULT 0 NOT NULL,
	"total_cost_usd" numeric DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_usage_daily_company_date_unique" UNIQUE("company_id","date")
);
--> statement-breakpoint
ALTER TABLE "company_usage_daily" ADD CONSTRAINT "company_usage_daily_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
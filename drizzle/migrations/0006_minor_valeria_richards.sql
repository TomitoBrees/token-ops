CREATE TABLE "company_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"budget" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_budgets_company_month_year_unique" UNIQUE("company_id","month","year")
);
--> statement-breakpoint
CREATE TABLE "company_usage_overview" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"total_calls" integer DEFAULT 0 NOT NULL,
	"tokens_consumed" integer DEFAULT 0 NOT NULL,
	"totalCostUsd" numeric,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_usage_overview_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
ALTER TABLE "company_budgets" ADD CONSTRAINT "company_budgets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_usage_overview" ADD CONSTRAINT "company_usage_overview_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
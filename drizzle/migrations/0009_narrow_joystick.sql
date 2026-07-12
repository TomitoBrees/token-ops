ALTER TABLE "company_budgets" ALTER COLUMN "company_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "company_usage_overview" ALTER COLUMN "total_cost_usd" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "company_usage_overview" ALTER COLUMN "total_cost_usd" SET NOT NULL;
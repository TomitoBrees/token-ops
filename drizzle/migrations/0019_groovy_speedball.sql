ALTER TABLE "company_budgets" DROP CONSTRAINT "company_budgets_company_month_year_unique";--> statement-breakpoint
ALTER TABLE "company_budgets" DROP COLUMN "month";--> statement-breakpoint
ALTER TABLE "company_budgets" DROP COLUMN "year";--> statement-breakpoint
ALTER TABLE "company_budgets" ADD CONSTRAINT "company_budgets_company_id_unique" UNIQUE("company_id");
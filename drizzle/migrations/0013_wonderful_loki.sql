ALTER TABLE "model_usage_daily" ADD COLUMN "model" text NOT NULL;--> statement-breakpoint
CREATE INDEX "company_model_usage_daily_company_date_idx" ON "model_usage_daily" USING btree ("company_id","date");--> statement-breakpoint
ALTER TABLE "model_usage_daily" ADD CONSTRAINT "company_model_usage_daily_company_model_date_unique" UNIQUE("company_id","model","date");
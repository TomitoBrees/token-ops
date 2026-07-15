-- 1. Function: runs on each new usage event
create or replace function public.sync_usage_daily()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_tokens integer;
  v_date date;
  v_model text;
begin
  -- Resolve company from the member who made the call
  select company_id
  into v_company_id
  from company_members
  where id = new.company_member_id;

  if v_company_id is null then
    raise exception 'company_member_id % not found', new.company_member_id;
  end if;

  v_tokens :=
    coalesce(new.input_tokens, 0)
    + coalesce(new.output_tokens, 0)
    + coalesce(new.cache_creation_input_tokens, 0)
    + coalesce(new.cache_read_input_tokens, 0);

  v_date := (new.created_at at time zone 'UTC')::date;
  v_model := coalesce(new.model, 'unknown');

  -- Single daily rollup at (member, model, date) grain
  insert into usage_daily (
    company_id,
    company_member_id,
    model,
    date,
    total_calls,
    tokens_consumed,
    total_cost_usd,
    updated_at
  )
  values (
    v_company_id,
    new.company_member_id,
    v_model,
    v_date,
    1,
    v_tokens,
    coalesce(new.estimated_cost_usd, 0),
    now()
  )
  on conflict (company_member_id, model, date) do update set
    total_calls     = usage_daily.total_calls + 1,
    tokens_consumed = usage_daily.tokens_consumed + excluded.tokens_consumed,
    total_cost_usd  = usage_daily.total_cost_usd + excluded.total_cost_usd,
    updated_at      = now();

  return new;
end;
$$;

-- 2. Trigger: calls the function after each insert
drop trigger if exists usage_events_sync_overview on public.usage_events;
drop trigger if exists usage_events_sync_usage_daily on public.usage_events;

create trigger usage_events_sync_usage_daily
  after insert on public.usage_events
  for each row
  execute function public.sync_usage_daily();

-- 3. Remove the now-obsolete function (replaced by sync_usage_daily)
drop function if exists public.sync_company_usage_overview();

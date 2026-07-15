-- 1. Function: runs on each new usage event
create or replace function public.sync_company_usage_overview()
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

  -- 2. Company daily rollup
  insert into company_usage_daily (
    company_id,
    date,
    total_calls,
    tokens_consumed,
    total_cost_usd,
    updated_at
  )
  values (
    v_company_id,
    v_date,
    1,
    v_tokens,
    coalesce(new.estimated_cost_usd, 0),
    now()
  )
  on conflict (company_id, date) do update set
    total_calls      = company_usage_daily.total_calls + 1,
    tokens_consumed  = company_usage_daily.tokens_consumed + excluded.tokens_consumed,
    total_cost_usd   = company_usage_daily.total_cost_usd + excluded.total_cost_usd,
    updated_at       = now();

  -- 3. Member daily rollup
  insert into member_usage_daily (
    company_member_id,
    company_id,
    date,
    total_calls,
    tokens_consumed,
    total_cost_usd,
    updated_at
  )
  values (
    new.company_member_id,
    v_company_id,
    v_date,
    1,
    v_tokens,
    coalesce(new.estimated_cost_usd, 0),
    now()
  )
  on conflict (company_member_id, date) do update set
    total_calls      = member_usage_daily.total_calls + 1,
    tokens_consumed  = member_usage_daily.tokens_consumed + excluded.tokens_consumed,
    total_cost_usd   = member_usage_daily.total_cost_usd + excluded.total_cost_usd,
    updated_at       = now();

  -- 4. Company model daily rollup
  insert into company_model_usage_daily (
    company_id,
    model,
    date,
    total_calls,
    tokens_consumed,
    total_cost_usd,
    updated_at
  )
  values (
    v_company_id,
    v_model,
    v_date,
    1,
    v_tokens,
    coalesce(new.estimated_cost_usd, 0),
    now()
  )
  on conflict (company_id, model, date) do update set
    total_calls      = company_model_usage_daily.total_calls + 1,
    tokens_consumed  = company_model_usage_daily.tokens_consumed + excluded.tokens_consumed,
    total_cost_usd   = company_model_usage_daily.total_cost_usd + excluded.total_cost_usd,
    updated_at       = now();

  -- 5. Member model daily rollup
  insert into member_model_usage_daily (
    company_member_id,
    company_id,
    model,
    date,
    total_calls,
    tokens_consumed,
    total_cost_usd,
    updated_at
  )
  values (
    new.company_member_id,
    v_company_id,
    v_model,
    v_date,
    1,
    v_tokens,
    coalesce(new.estimated_cost_usd, 0),
    now()
  )
  on conflict (company_member_id, model, date) do update set
    total_calls      = member_model_usage_daily.total_calls + 1,
    tokens_consumed  = member_model_usage_daily.tokens_consumed + excluded.tokens_consumed,
    total_cost_usd   = member_model_usage_daily.total_cost_usd + excluded.total_cost_usd,
    updated_at       = now();

  return new;
end;
$$;

-- 2. Trigger: calls the function after each insert
drop trigger if exists usage_events_sync_overview on public.usage_events;

create trigger usage_events_sync_overview
  after insert on public.usage_events
  for each row
  execute function public.sync_company_usage_overview();

-- Dukaan Dost schema (TRD section 4). All money is integer paise.
create extension if not exists pg_trgm;
create extension if not exists unaccent;

create table shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  upi_vpa text,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  display_name text not null,
  area text,
  name_roman text not null,
  name_devanagari text,
  aliases text[] not null default '{}',
  phone_e164 text,
  created_at timestamptz not null default now()
);
create index customers_trgm on customers using gin (name_roman gin_trgm_ops);

create type entry_type as enum ('credit_given', 'payment_received');

create table entries (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  customer_id uuid not null references customers(id),
  type entry_type not null,
  amount_paise bigint not null check (amount_paise > 0),
  note text,
  source_text text not null,
  source text not null check (source in ('voice','text','sample')),
  idempotency_key text not null,
  confirmed_at timestamptz not null default now(),
  voided_at timestamptz,
  void_reason text,
  unique (shop_id, idempotency_key)
);

create table stock_flags (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  item_name text not null,
  level text not null default 'low',
  source_text text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table pay_tokens (
  token text primary key,
  shop_id uuid not null references shops(id) on delete cascade,
  customer_id uuid not null references customers(id),
  amount_paise bigint not null,
  expires_at timestamptz not null
);

create table audit_events (
  id bigint generated always as identity primary key,
  shop_id uuid not null,
  kind text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create view customer_balances as
select c.id as customer_id, c.shop_id,
  coalesce(sum(case when e.type = 'credit_given' then e.amount_paise
                    when e.type = 'payment_received' then -e.amount_paise end), 0) as balance_paise
from customers c
left join entries e on e.customer_id = c.id and e.voided_at is null
group by c.id, c.shop_id;

-- Fuzzy customer match for the SQL side (the app does the same scoring in TypeScript for the local store).
create or replace function match_customers(p_shop uuid, p_query text, p_limit int default 3)
returns table (customer_id uuid, display_name text, score real)
language sql stable as $$
  select id, display_name, similarity(name_roman, lower(unaccent(p_query)))::real as score
  from customers
  where shop_id = p_shop and similarity(name_roman, lower(unaccent(p_query))) > 0.35
  order by score desc
  limit p_limit;
$$;

-- Row-level security on for every table. The app uses the service role from API routes only,
-- so there are deliberately no policies for anon: the browser can read nothing directly.
alter table shops enable row level security;
alter table customers enable row level security;
alter table entries enable row level security;
alter table stock_flags enable row level security;
alter table pay_tokens enable row level security;
alter table audit_events enable row level security;

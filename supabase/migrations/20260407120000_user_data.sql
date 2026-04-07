-- User-owned data with RLS. Run in Supabase SQL editor or via supabase db push.

create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.watchlist_symbols (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists (id) on delete cascade,
  symbol text not null,
  position int not null default 0,
  unique (watchlist_id, symbol)
);

create table public.lifestyle_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.lifestyle_draft (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.fx_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.saved_savings_accounts (
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id text not null,
  primary key (user_id, account_id)
);

create table public.saved_credit_cards (
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id text not null,
  primary key (user_id, card_id)
);

create table public.calculator_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  tab text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index watchlists_user_id_idx on public.watchlists (user_id);
create index watchlist_symbols_watchlist_id_idx on public.watchlist_symbols (watchlist_id);
create index lifestyle_scenarios_user_id_idx on public.lifestyle_scenarios (user_id);
create index calculator_snapshots_user_id_idx on public.calculator_snapshots (user_id);

alter table public.watchlists enable row level security;
alter table public.watchlist_symbols enable row level security;
alter table public.lifestyle_scenarios enable row level security;
alter table public.lifestyle_draft enable row level security;
alter table public.fx_preferences enable row level security;
alter table public.saved_savings_accounts enable row level security;
alter table public.saved_credit_cards enable row level security;
alter table public.calculator_snapshots enable row level security;

create policy watchlists_select on public.watchlists for select using (auth.uid() = user_id);
create policy watchlists_insert on public.watchlists for insert with check (auth.uid() = user_id);
create policy watchlists_update on public.watchlists for update using (auth.uid() = user_id);
create policy watchlists_delete on public.watchlists for delete using (auth.uid() = user_id);

create policy watchlist_symbols_select on public.watchlist_symbols for select
  using (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = auth.uid()));
create policy watchlist_symbols_insert on public.watchlist_symbols for insert
  with check (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = auth.uid()));
create policy watchlist_symbols_update on public.watchlist_symbols for update
  using (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = auth.uid()));
create policy watchlist_symbols_delete on public.watchlist_symbols for delete
  using (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = auth.uid()));

create policy lifestyle_scenarios_select on public.lifestyle_scenarios for select using (auth.uid() = user_id);
create policy lifestyle_scenarios_insert on public.lifestyle_scenarios for insert with check (auth.uid() = user_id);
create policy lifestyle_scenarios_update on public.lifestyle_scenarios for update using (auth.uid() = user_id);
create policy lifestyle_scenarios_delete on public.lifestyle_scenarios for delete using (auth.uid() = user_id);

create policy lifestyle_draft_select on public.lifestyle_draft for select using (auth.uid() = user_id);
create policy lifestyle_draft_insert on public.lifestyle_draft for insert with check (auth.uid() = user_id);
create policy lifestyle_draft_update on public.lifestyle_draft for update using (auth.uid() = user_id);
create policy lifestyle_draft_delete on public.lifestyle_draft for delete using (auth.uid() = user_id);

create policy fx_preferences_select on public.fx_preferences for select using (auth.uid() = user_id);
create policy fx_preferences_insert on public.fx_preferences for insert with check (auth.uid() = user_id);
create policy fx_preferences_update on public.fx_preferences for update using (auth.uid() = user_id);
create policy fx_preferences_delete on public.fx_preferences for delete using (auth.uid() = user_id);

create policy saved_savings_select on public.saved_savings_accounts for select using (auth.uid() = user_id);
create policy saved_savings_insert on public.saved_savings_accounts for insert with check (auth.uid() = user_id);
create policy saved_savings_delete on public.saved_savings_accounts for delete using (auth.uid() = user_id);

create policy saved_cards_select on public.saved_credit_cards for select using (auth.uid() = user_id);
create policy saved_cards_insert on public.saved_credit_cards for insert with check (auth.uid() = user_id);
create policy saved_cards_delete on public.saved_credit_cards for delete using (auth.uid() = user_id);

create policy calculator_snapshots_select on public.calculator_snapshots for select using (auth.uid() = user_id);
create policy calculator_snapshots_insert on public.calculator_snapshots for insert with check (auth.uid() = user_id);
create policy calculator_snapshots_update on public.calculator_snapshots for update using (auth.uid() = user_id);
create policy calculator_snapshots_delete on public.calculator_snapshots for delete using (auth.uid() = user_id);

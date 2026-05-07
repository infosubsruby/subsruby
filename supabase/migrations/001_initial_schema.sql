-- Safe foundation migration for Ruby finance platform.
-- This file is documentation/migration-ready and does not run automatically from the app.
-- Review/adjust against your existing Supabase schema before applying in production.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  preferred_currency text not null default 'USD',
  country text,
  monthly_income numeric not null default 0,
  savings_target numeric not null default 0,
  ruby_ai_focus text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null default 'bank',
  balance numeric not null default 0,
  currency text not null default 'USD',
  provider text,
  is_manual boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_wallets_user_id on public.wallets(user_id);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  type text not null default 'expense',
  icon text,
  color text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_categories_user_id on public.categories(user_id);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wallet_id uuid references public.wallets(id) on delete set null,
  merchant text,
  description text not null,
  amount numeric not null,
  currency text not null default 'USD',
  type text not null default 'expense',
  category_id uuid references public.categories(id) on delete set null,
  category_name text not null,
  date date not null default current_date,
  tags text[] not null default '{}',
  is_recurring boolean not null default false,
  ai_flags jsonb not null default '[]'::jsonb,
  confidence_score numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_wallet_id on public.transactions(wallet_id);
create index if not exists idx_transactions_date on public.transactions(date);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wallet_id uuid references public.wallets(id) on delete set null,
  name text not null,
  amount numeric not null,
  currency text not null default 'USD',
  billing_cycle text not null default 'monthly',
  next_billing_date date not null,
  category_id uuid references public.categories(id) on delete set null,
  category_name text not null default 'Subscriptions',
  status text not null default 'active',
  yearly_cost numeric not null default 0,
  optimization_status text,
  ai_recommendation text,
  usage_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_next_billing on public.subscriptions(next_billing_date);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  currency text not null default 'USD',
  deadline date,
  status text not null default 'on_track',
  monthly_target numeric not null default 0,
  predicted_completion_date date,
  priority text not null default 'medium',
  ai_recommendation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_goals_user_id on public.goals(user_id);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month text not null,
  total_income numeric not null default 0,
  planned_spending numeric not null default 0,
  savings_target numeric not null default 0,
  safe_to_spend_daily numeric not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_budgets_user_id on public.budgets(user_id);
create index if not exists idx_budgets_month on public.budgets(month);

create table if not exists public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  category_name text not null,
  planned_amount numeric not null default 0,
  spent_amount numeric not null default 0,
  remaining_amount numeric not null default 0,
  risk_level text not null default 'medium',
  ai_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_budget_categories_budget_id on public.budget_categories(budget_id);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  description text not null,
  severity text not null default 'info',
  confidence numeric not null default 0,
  financial_impact numeric,
  suggested_action text,
  related_entity_type text,
  related_entity_id uuid,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists idx_ai_insights_user_id on public.ai_insights(user_id);

create table if not exists public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month text not null,
  total_income numeric not null default 0,
  total_expenses numeric not null default 0,
  net_savings numeric not null default 0,
  savings_rate numeric not null default 0,
  health_score numeric not null default 0,
  previous_health_score numeric,
  top_categories jsonb not null default '[]'::jsonb,
  subscription_impact jsonb not null default '{}'::jsonb,
  goal_progress jsonb not null default '[]'::jsonb,
  ai_summary text not null default '',
  recommended_actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_monthly_reports_user_id on public.monthly_reports(user_id);
create index if not exists idx_monthly_reports_month on public.monthly_reports(month);

create table if not exists public.ruby_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  mode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ruby_ai_conversations_user_id on public.ruby_ai_conversations(user_id);

create table if not exists public.ruby_ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ruby_ai_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'user',
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_ruby_ai_messages_conversation_id on public.ruby_ai_messages(conversation_id);
create index if not exists idx_ruby_ai_messages_user_id on public.ruby_ai_messages(user_id);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  theme text not null default 'dark',
  accent_color text not null default 'ruby',
  compact_mode boolean not null default false,
  animations_enabled boolean not null default true,
  insight_frequency text not null default 'weekly',
  risk_sensitivity text not null default 'medium',
  student_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  plan_type text not null default 'free',
  billing_cycle text,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_user_plans_user_id on public.user_plans(user_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.goals enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_categories enable row level security;
alter table public.categories enable row level security;
alter table public.ai_insights enable row level security;
alter table public.monthly_reports enable row level security;
alter table public.ruby_ai_conversations enable row level security;
alter table public.ruby_ai_messages enable row level security;
alter table public.app_settings enable row level security;
alter table public.user_plans enable row level security;

-- Profiles are owned by auth user id.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());

-- Generic user-owned table policy pattern: user_id = auth.uid()
drop policy if exists "wallets_user_owned_all" on public.wallets;
create policy "wallets_user_owned_all" on public.wallets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "transactions_user_owned_all" on public.transactions;
create policy "transactions_user_owned_all" on public.transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "subscriptions_user_owned_all" on public.subscriptions;
create policy "subscriptions_user_owned_all" on public.subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "goals_user_owned_all" on public.goals;
create policy "goals_user_owned_all" on public.goals for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "budgets_user_owned_all" on public.budgets;
create policy "budgets_user_owned_all" on public.budgets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "categories_user_owned_all" on public.categories;
create policy "categories_user_owned_all" on public.categories for all using (user_id = auth.uid() or user_id is null) with check (user_id = auth.uid() or user_id is null);
drop policy if exists "ai_insights_user_owned_all" on public.ai_insights;
create policy "ai_insights_user_owned_all" on public.ai_insights for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "monthly_reports_user_owned_all" on public.monthly_reports;
create policy "monthly_reports_user_owned_all" on public.monthly_reports for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "ruby_ai_conversations_user_owned_all" on public.ruby_ai_conversations;
create policy "ruby_ai_conversations_user_owned_all" on public.ruby_ai_conversations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "app_settings_user_owned_all" on public.app_settings;
create policy "app_settings_user_owned_all" on public.app_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "user_plans_user_owned_all" on public.user_plans;
create policy "user_plans_user_owned_all" on public.user_plans for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- budget_categories ownership follows parent budget owner.
drop policy if exists "budget_categories_owner_via_budget" on public.budget_categories;
create policy "budget_categories_owner_via_budget" on public.budget_categories
for all
using (
  exists (
    select 1
    from public.budgets b
    where b.id = budget_categories.budget_id
      and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.budgets b
    where b.id = budget_categories.budget_id
      and b.user_id = auth.uid()
  )
);

-- ruby_ai_messages ownership follows parent conversation owner.
drop policy if exists "ruby_ai_messages_owner_via_conversation" on public.ruby_ai_messages;
create policy "ruby_ai_messages_owner_via_conversation" on public.ruby_ai_messages
for all
using (
  exists (
    select 1
    from public.ruby_ai_conversations c
    where c.id = ruby_ai_messages.conversation_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.ruby_ai_conversations c
    where c.id = ruby_ai_messages.conversation_id
      and c.user_id = auth.uid()
  )
);

-- NOTE: Before production rollout, manually verify:
-- 1) policy names do not collide with existing project policies
-- 2) enum/domain constraints match your app contracts
-- 3) trigger strategy for updated_at columns
-- 4) service-role administrative access paths


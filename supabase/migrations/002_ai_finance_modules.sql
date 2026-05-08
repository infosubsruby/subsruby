-- Draft migration only. Do not auto-apply.
-- Purpose: add missing AI finance module tables while preserving existing auth/payment architecture.
-- Important distinction to preserve:
--   - user_subscriptions = SaaS billing/payment plan state
--   - subscriptions = user's financial recurring subscriptions

create extension if not exists pgcrypto;

-- 1) wallets
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null,
  balance numeric not null default 0,
  currency text not null default 'USD',
  provider text null,
  is_manual boolean not null default true,
  last_synced_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallets_type_check check (type in ('cash', 'bank', 'savings', 'credit_card', 'crypto', 'investment', 'custom'))
);

-- 2) goals
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  target_amount numeric not null default 0,
  current_amount numeric not null default 0,
  currency text not null default 'USD',
  deadline date null,
  status text not null default 'on_track',
  monthly_target numeric not null default 0,
  predicted_completion_date date null,
  priority text not null default 'medium',
  ai_recommendation text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_status_check check (status in ('on_track', 'ahead', 'behind', 'completed', 'paused')),
  constraint goals_priority_check check (priority in ('low', 'medium', 'high'))
);

-- 3) ai_insights
create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  description text not null,
  severity text not null default 'info',
  confidence numeric not null default 0,
  financial_impact numeric null,
  suggested_action text null,
  related_entity_type text null,
  related_entity_id uuid null,
  is_resolved boolean not null default false,
  resolved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_insights_severity_check check (severity in ('info', 'success', 'warning', 'critical'))
);

-- 4) ruby_ai_conversations
create table if not exists public.ruby_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  mode text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5) ruby_ai_messages
create table if not exists public.ruby_ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ruby_ai_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ruby_ai_messages_role_check check (role in ('user', 'assistant', 'system'))
);

-- 6) monthly_reports
create table if not exists public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month text not null,
  total_income numeric not null default 0,
  total_expenses numeric not null default 0,
  net_savings numeric not null default 0,
  savings_rate numeric not null default 0,
  health_score numeric not null default 0,
  previous_health_score numeric null,
  top_categories jsonb not null default '[]'::jsonb,
  subscription_impact jsonb not null default '{}'::jsonb,
  goal_progress jsonb not null default '[]'::jsonb,
  ai_summary text not null default '',
  recommended_actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_reports_user_month_unique unique (user_id, month)
);

-- 7) app_settings
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  theme text not null default 'dark',
  accent_color text not null default 'red',
  compact_mode boolean not null default false,
  animations_enabled boolean not null default true,
  insight_frequency text not null default 'weekly',
  risk_sensitivity text not null default 'medium',
  student_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_settings_user_unique unique (user_id)
);

-- 8) financial_health_history
create table if not exists public.financial_health_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score numeric not null default 0,
  status text not null,
  savings_rate_score numeric not null default 0,
  spending_control_score numeric not null default 0,
  subscription_burden_score numeric not null default 0,
  emergency_fund_score numeric not null default 0,
  budget_discipline_score numeric not null default 0,
  cash_flow_stability_score numeric not null default 0,
  goal_progress_score numeric not null default 0,
  debt_credit_risk_score numeric not null default 0,
  notes text null,
  created_at timestamptz not null default now(),
  constraint financial_health_history_status_check check (status in ('excellent', 'good', 'moderate', 'risky', 'critical'))
);

-- Indexes
create index if not exists idx_wallets_user_id on public.wallets(user_id);
create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_ai_insights_user_created on public.ai_insights(user_id, created_at desc);
create index if not exists idx_ai_insights_user_resolved on public.ai_insights(user_id, is_resolved);
create index if not exists idx_ai_insights_unresolved_created on public.ai_insights(user_id, created_at desc) where is_resolved = false;
create index if not exists idx_ruby_ai_conversations_user_created on public.ruby_ai_conversations(user_id, created_at desc);
create index if not exists idx_ruby_ai_messages_conversation_created on public.ruby_ai_messages(conversation_id, created_at desc);
create index if not exists idx_ruby_ai_messages_user_id on public.ruby_ai_messages(user_id);
create index if not exists idx_monthly_reports_user_month on public.monthly_reports(user_id, month);
create index if not exists idx_app_settings_user_id on public.app_settings(user_id);
create index if not exists idx_financial_health_history_user_created on public.financial_health_history(user_id, created_at desc);

-- Reusable updated_at trigger function (safe to replace)
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Safely no-op for table variants that do not expose updated_at.
  new := jsonb_populate_record(new, jsonb_build_object('updated_at', now()));
  return new;
end;
$$;

drop trigger if exists trg_wallets_updated_at on public.wallets;
create trigger trg_wallets_updated_at
before update on public.wallets
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_goals_updated_at on public.goals;
create trigger trg_goals_updated_at
before update on public.goals
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_ai_insights_updated_at on public.ai_insights;
create trigger trg_ai_insights_updated_at
before update on public.ai_insights
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_ruby_ai_conversations_updated_at on public.ruby_ai_conversations;
create trigger trg_ruby_ai_conversations_updated_at
before update on public.ruby_ai_conversations
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_monthly_reports_updated_at on public.monthly_reports;
create trigger trg_monthly_reports_updated_at
before update on public.monthly_reports
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_app_settings_updated_at on public.app_settings;
create trigger trg_app_settings_updated_at
before update on public.app_settings
for each row execute function public.update_updated_at_column();

-- RLS
alter table public.wallets enable row level security;
alter table public.goals enable row level security;
alter table public.ai_insights enable row level security;
alter table public.ruby_ai_conversations enable row level security;
alter table public.ruby_ai_messages enable row level security;
alter table public.monthly_reports enable row level security;
alter table public.app_settings enable row level security;
alter table public.financial_health_history enable row level security;

-- wallets policies
drop policy if exists "wallets_select_own" on public.wallets;
create policy "wallets_select_own" on public.wallets
for select to authenticated using (user_id = auth.uid());

drop policy if exists "wallets_insert_own" on public.wallets;
create policy "wallets_insert_own" on public.wallets
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "wallets_update_own" on public.wallets;
create policy "wallets_update_own" on public.wallets
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "wallets_delete_own" on public.wallets;
create policy "wallets_delete_own" on public.wallets
for delete to authenticated using (user_id = auth.uid());

-- goals policies
drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals
for select to authenticated using (user_id = auth.uid());

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals
for delete to authenticated using (user_id = auth.uid());

-- ai_insights policies
drop policy if exists "ai_insights_select_own" on public.ai_insights;
create policy "ai_insights_select_own" on public.ai_insights
for select to authenticated using (user_id = auth.uid());

drop policy if exists "ai_insights_insert_own" on public.ai_insights;
create policy "ai_insights_insert_own" on public.ai_insights
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "ai_insights_update_own" on public.ai_insights;
create policy "ai_insights_update_own" on public.ai_insights
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "ai_insights_delete_own" on public.ai_insights;
create policy "ai_insights_delete_own" on public.ai_insights
for delete to authenticated using (user_id = auth.uid());

-- ruby_ai_conversations policies
drop policy if exists "ruby_ai_conversations_select_own" on public.ruby_ai_conversations;
create policy "ruby_ai_conversations_select_own" on public.ruby_ai_conversations
for select to authenticated using (user_id = auth.uid());

drop policy if exists "ruby_ai_conversations_insert_own" on public.ruby_ai_conversations;
create policy "ruby_ai_conversations_insert_own" on public.ruby_ai_conversations
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "ruby_ai_conversations_update_own" on public.ruby_ai_conversations;
create policy "ruby_ai_conversations_update_own" on public.ruby_ai_conversations
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "ruby_ai_conversations_delete_own" on public.ruby_ai_conversations;
create policy "ruby_ai_conversations_delete_own" on public.ruby_ai_conversations
for delete to authenticated using (user_id = auth.uid());

-- ruby_ai_messages policies
drop policy if exists "ruby_ai_messages_select_own" on public.ruby_ai_messages;
create policy "ruby_ai_messages_select_own" on public.ruby_ai_messages
for select to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.ruby_ai_conversations c
    where c.id = ruby_ai_messages.conversation_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "ruby_ai_messages_insert_own" on public.ruby_ai_messages;
create policy "ruby_ai_messages_insert_own" on public.ruby_ai_messages
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.ruby_ai_conversations c
    where c.id = ruby_ai_messages.conversation_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "ruby_ai_messages_update_own" on public.ruby_ai_messages;
create policy "ruby_ai_messages_update_own" on public.ruby_ai_messages
for update to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.ruby_ai_conversations c
    where c.id = ruby_ai_messages.conversation_id
      and c.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.ruby_ai_conversations c
    where c.id = ruby_ai_messages.conversation_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "ruby_ai_messages_delete_own" on public.ruby_ai_messages;
create policy "ruby_ai_messages_delete_own" on public.ruby_ai_messages
for delete to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.ruby_ai_conversations c
    where c.id = ruby_ai_messages.conversation_id
      and c.user_id = auth.uid()
  )
);

-- monthly_reports policies
drop policy if exists "monthly_reports_select_own" on public.monthly_reports;
create policy "monthly_reports_select_own" on public.monthly_reports
for select to authenticated using (user_id = auth.uid());

drop policy if exists "monthly_reports_insert_own" on public.monthly_reports;
create policy "monthly_reports_insert_own" on public.monthly_reports
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "monthly_reports_update_own" on public.monthly_reports;
create policy "monthly_reports_update_own" on public.monthly_reports
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "monthly_reports_delete_own" on public.monthly_reports;
create policy "monthly_reports_delete_own" on public.monthly_reports
for delete to authenticated using (user_id = auth.uid());

-- app_settings policies
drop policy if exists "app_settings_select_own" on public.app_settings;
create policy "app_settings_select_own" on public.app_settings
for select to authenticated using (user_id = auth.uid());

drop policy if exists "app_settings_insert_own" on public.app_settings;
create policy "app_settings_insert_own" on public.app_settings
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "app_settings_update_own" on public.app_settings;
create policy "app_settings_update_own" on public.app_settings
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "app_settings_delete_own" on public.app_settings;
create policy "app_settings_delete_own" on public.app_settings
for delete to authenticated using (user_id = auth.uid());

-- financial_health_history policies
drop policy if exists "financial_health_history_select_own" on public.financial_health_history;
create policy "financial_health_history_select_own" on public.financial_health_history
for select to authenticated using (user_id = auth.uid());

drop policy if exists "financial_health_history_insert_own" on public.financial_health_history;
create policy "financial_health_history_insert_own" on public.financial_health_history
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "financial_health_history_update_own" on public.financial_health_history;
create policy "financial_health_history_update_own" on public.financial_health_history
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "financial_health_history_delete_own" on public.financial_health_history;
create policy "financial_health_history_delete_own" on public.financial_health_history
for delete to authenticated using (user_id = auth.uid());

# Database Schema Foundation (Supabase/PostgreSQL Ready)

This document defines a **future-ready finance schema** for Supabase/PostgreSQL while preserving the current mock/demo UI behavior.

## Scope
- No live migration is executed by this document.
- No real bank sync, payment, or OpenAI integration is enabled.
- The schema is designed for later implementation in SQL migrations.

## Tables

### `profiles`
- `id uuid primary key references auth.users(id)`
- `full_name text`
- `avatar_url text null`
- `preferred_currency text default 'USD'`
- `country text null`
- `monthly_income numeric default 0`
- `savings_target numeric default 0`
- `ruby_ai_focus text null`
- `onboarding_completed boolean default false`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `wallets`
- `id uuid primary key`
- `user_id uuid references profiles(id)`
- `name text`
- `type text` (`cash | bank | savings | credit_card | crypto | investment | custom`)
- `balance numeric`
- `currency text`
- `provider text null`
- `is_manual boolean default true`
- `last_synced_at timestamptz null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `categories`
- `id uuid primary key`
- `user_id uuid null references profiles(id)`
- `name text`
- `type text` (`income | expense | transfer`)
- `icon text null`
- `color text null`
- `is_default boolean default false`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `transactions`
- `id uuid primary key`
- `user_id uuid references profiles(id)`
- `wallet_id uuid references wallets(id)`
- `merchant text null`
- `description text`
- `amount numeric`
- `currency text`
- `type text` (`income | expense | transfer`)
- `category_id uuid null references categories(id)`
- `category_name text`
- `date date`
- `tags text[] default '{}'`
- `is_recurring boolean default false`
- `ai_flags jsonb default '[]'::jsonb`
- `confidence_score numeric null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `subscriptions`
- `id uuid primary key`
- `user_id uuid references profiles(id)`
- `wallet_id uuid null references wallets(id)`
- `name text`
- `amount numeric`
- `currency text`
- `billing_cycle text` (`weekly | monthly | yearly`)
- `next_billing_date date`
- `category_id uuid null references categories(id)`
- `category_name text`
- `status text` (`active | paused | cancelled`)
- `yearly_cost numeric`
- `optimization_status text null`
- `ai_recommendation text null`
- `usage_status text null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `goals`
- `id uuid primary key`
- `user_id uuid references profiles(id)`
- `title text`
- `target_amount numeric`
- `current_amount numeric`
- `currency text`
- `deadline date null`
- `status text` (`on_track | ahead | behind | completed | paused`)
- `monthly_target numeric`
- `predicted_completion_date date null`
- `priority text` (`low | medium | high`)
- `ai_recommendation text null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `budgets`
- `id uuid primary key`
- `user_id uuid references profiles(id)`
- `month text`
- `total_income numeric`
- `planned_spending numeric`
- `savings_target numeric`
- `safe_to_spend_daily numeric`
- `status text`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `budget_categories`
- `id uuid primary key`
- `budget_id uuid references budgets(id)`
- `category_id uuid null references categories(id)`
- `category_name text`
- `planned_amount numeric`
- `spent_amount numeric`
- `remaining_amount numeric`
- `risk_level text` (`low | medium | high`)
- `ai_comment text null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `ai_insights`
- `id uuid primary key`
- `user_id uuid references profiles(id)`
- `type text`
- `title text`
- `description text`
- `severity text` (`info | success | warning | critical`)
- `confidence numeric`
- `financial_impact numeric null`
- `suggested_action text null`
- `related_entity_type text null`
- `related_entity_id uuid null`
- `is_resolved boolean default false`
- `created_at timestamptz default now()`
- `resolved_at timestamptz null`

### `monthly_reports`
- `id uuid primary key`
- `user_id uuid references profiles(id)`
- `month text`
- `total_income numeric`
- `total_expenses numeric`
- `net_savings numeric`
- `savings_rate numeric`
- `health_score numeric`
- `previous_health_score numeric null`
- `top_categories jsonb`
- `subscription_impact jsonb`
- `goal_progress jsonb`
- `ai_summary text`
- `recommended_actions jsonb`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `ruby_ai_conversations`
- `id uuid primary key`
- `user_id uuid references profiles(id)`
- `title text`
- `mode text null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `ruby_ai_messages`
- `id uuid primary key`
- `conversation_id uuid references ruby_ai_conversations(id)`
- `user_id uuid references profiles(id)`
- `role text` (`user | assistant | system`)
- `content text`
- `metadata jsonb null`
- `created_at timestamptz default now()`

### `app_settings`
- `id uuid primary key`
- `user_id uuid references profiles(id)`
- `theme text default 'dark'`
- `accent_color text default 'red'`
- `compact_mode boolean default false`
- `animations_enabled boolean default true`
- `insight_frequency text default 'weekly'`
- `risk_sensitivity text default 'medium'`
- `student_mode boolean default false`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `user_plans`
- `id uuid primary key`
- `user_id uuid references profiles(id)`
- `plan_type text default 'free'` (`free | pro`)
- `billing_cycle text null` (`weekly | monthly | yearly`)
- `status text default 'active'`
- `started_at timestamptz default now()`
- `expires_at timestamptz null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

## RLS Strategy (Example Policies)

Enable RLS for each user-owned table:

```sql
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.goals enable row level security;
alter table public.budgets enable row level security;
alter table public.ai_insights enable row level security;
alter table public.monthly_reports enable row level security;
alter table public.ruby_ai_conversations enable row level security;
alter table public.ruby_ai_messages enable row level security;
alter table public.app_settings enable row level security;
alter table public.user_plans enable row level security;
```

Policy pattern for direct `user_id` tables:

```sql
create policy "own_select_wallets" on public.wallets
for select using (auth.uid() = user_id);

create policy "own_insert_wallets" on public.wallets
for insert with check (auth.uid() = user_id);

create policy "own_update_wallets" on public.wallets
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_delete_wallets" on public.wallets
for delete using (auth.uid() = user_id);
```

Apply the same shape to:
- `transactions`
- `subscriptions`
- `goals`
- `budgets`
- `ai_insights`
- `monthly_reports`
- `app_settings`
- `user_plans`

Conversation/message ownership:

```sql
create policy "own_select_conversations" on public.ruby_ai_conversations
for select using (auth.uid() = user_id);

create policy "own_insert_conversations" on public.ruby_ai_conversations
for insert with check (auth.uid() = user_id);

create policy "own_select_messages" on public.ruby_ai_messages
for select using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.ruby_ai_conversations c
    where c.id = ruby_ai_messages.conversation_id
      and c.user_id = auth.uid()
  )
);
```

## Type & Mapper Plan

Implemented in:
- `src/lib/supabase/types.ts`
- `src/lib/supabase/mappers.ts`
- `src/lib/supabase/schema.ts`
- `src/lib/supabase/client.ts`

Snake_case DB row types are intentionally separate from camelCase frontend domain models, with safe mappers for future repository/adapters.

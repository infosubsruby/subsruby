# AI Finance Migration Plan (Draft Only)

## Purpose
This draft adds missing backend tables required by new AI finance modules, while preserving the existing working Supabase/auth/payment architecture.

Migration draft file:
- `supabase/migrations/002_ai_finance_modules.sql`

Important preserved distinction:
- `user_subscriptions` = SaaS billing/payment plan state
- `subscriptions` = user financial recurring subscriptions (Netflix/Spotify-style)

## What This Migration Adds
The draft creates the following tables with `create table if not exists`:

1. `wallets`
2. `goals`
3. `ai_insights`
4. `ruby_ai_conversations`
5. `ruby_ai_messages`
6. `monthly_reports`
7. `app_settings`
8. `financial_health_history`

It also includes:
- required indexes
- `updated_at` trigger function and triggers on tables that have `updated_at`
- RLS enabled on all new tables
- per-user CRUD policies using `auth.uid()` ownership checks
- extra ownership check for `ruby_ai_messages` via parent conversation

Safety hardening in the draft:
- `create extension if not exists pgcrypto;` for `gen_random_uuid()`
- idempotent trigger/policy creation (`drop ... if exists` before create)
- defensive `update_updated_at_column()` implementation that safely no-ops on table variants without `updated_at`
- JSONB defaults on AI/message/report payload columns to reduce null-shape runtime issues
- additional rerun-safe indexes for unresolved insights and Ruby message user lookups

## Why Each Table Is Needed
- `wallets`: account-level balances and source metadata for Wallets/Overview aggregation.
- `goals`: persistent goal tracking for Goals page and Planning Hub.
- `ai_insights`: stored AI findings, severity, resolution state.
- `ruby_ai_conversations`: conversation containers for Ruby AI sessions.
- `ruby_ai_messages`: message history per conversation.
- `monthly_reports`: richer month-level report persistence beyond current archive shape.
- `app_settings`: durable app preferences (compact mode, animations, student mode, etc.).
- `financial_health_history`: trend history for financial health score over time.

## What Remains Mock Until Migration Is Applied
These modules should remain mock/local until the migration is applied and types are regenerated:
- Goals
- Wallets
- AI Insights
- Ruby AI Conversations/Messages
- Monthly Reports (rich model)
- Financial Health history persistence
- Extended app settings persistence

## Existing Systems That Must Stay Untouched
Do not alter behavior for:
- auth/session/profile flow
- existing payments/checkout/customer portal flow
- existing plan entitlement checks
- current finance logic around `transactions`, `budgets`, `monthly_archives`
- current recurring financial subscription flow on `subscriptions`

Do not repurpose:
- `user_subscriptions` for Netflix/Spotify tracking
- `subscriptions` for SaaS billing entitlement

This migration does not alter:
- `profiles`
- `transactions`
- `budgets`
- `subscriptions`
- `user_subscriptions`
- `services`
- `monthly_archives`
- `quick_add_shortcuts`
- `exchange_rates`
- `feedbacks`

## Post-Apply Checklist (For Later)
After manual review and manual migration apply (not in this step):

1. Regenerate Supabase types to refresh `src/integrations/supabase/types.ts`.
2. Switch module services from mock to real one-by-one (goals, wallets, insights, ruby AI, reports, health history, app settings).
3. Run full TypeScript/build checks.
4. Re-test auth and payment/subscription flows end-to-end:
   - login/signup/session persistence
   - profile updates/onboarding state
   - checkout flow
   - customer portal access
   - entitlement checks from `user_subscriptions`
5. Confirm frontend/domain status/type mappings remain aligned after type regeneration:
   - DB goals allow `paused` and `on_track` (DB-form), while frontend still uses `on-track`; current goal mappers explicitly convert `on-track` <-> `on_track` and map DB `paused` to a safe frontend fallback
   - wallet DB values are snake_case (`bank`, `credit_card`) and are converted in mappers to domain values (`checking`, `credit`)

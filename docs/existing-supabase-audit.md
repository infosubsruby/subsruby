# Existing Supabase Audit And Safe Migration Plan

## Scope and Constraints
- This audit uses the current generated types in `src/integrations/supabase/types.ts` as the source of truth.
- Existing Supabase/auth/payment architecture is preserved.
- No schema changes are applied in this step.
- No migration is executed in this step.

## 1. Existing Supabase Tables (Source Of Truth)
Based on `src/integrations/supabase/types.ts`, the `public` schema currently includes:

1. `profiles`
2. `transactions`
3. `budgets`
4. `monthly_archives`
5. `subscriptions`
6. `subscription_plans`
7. `services`
8. `user_subscriptions`
9. `feedbacks`
10. `exchange_rates`
11. `quick_add_shortcuts`
12. `user_roles`

### Important columns by table
- `profiles`
  - Identity/profile: `id`, `email`, `first_name`, `last_name`, `avatar_url`, `phone`, `created_at`
  - Auth/onboarding/preferences: `has_completed_onboarding`, `default_currency`, `language`
  - SaaS billing linkage: `lemon_squeezy_customer_id`, `subscription_id`, `variant_id`, `status`, `current_period_end`
- `transactions`
  - Core ledger: `id`, `user_id`, `amount`, `type`, `category`, `description`, `date`, `created_at`
- `budgets`
  - Category budgets: `id`, `user_id`, `category`, `limit_amount`, `created_at`
- `monthly_archives`
  - Historical summary snapshots: `month_key`, `title`, `ai_insight`, `sentiment`, `total_income`, `total_expense`, `net_savings`, `transactions`, `user_id`
- `subscriptions`
  - Financial recurring subscriptions (Netflix/Spotify-style): `id`, `user_id`, `name`, `slug`, `price`, `currency`, `billing_cycle`, `start_date`, `next_payment_date`, `website_url`, `card_color`, `country_code`
- `subscription_plans`
  - Service plan catalog metadata: `service_id`, `service_name`, `plan_name`, `billing_period`, `billing_cycle`, `price`, `currency`, `country_code`
- `services`
  - Service metadata: `id`, `name`, `slug`, `logo_url`, `color`, `category`
- `user_subscriptions`
  - SaaS billing plan state (app subscription): `user_id`, `status`, `subscription_id`, `variant_id`, `lemon_squeezy_customer_id`, `customer_portal_url`, `current_period_end`
- `feedbacks`
  - Support/feedback workflow: `id`, `user_id`, `type`, `subject`, `message`, `status`, `admin_response`, `rating`, `created_at`, `updated_at`
- `exchange_rates`
  - FX data cache: `currency_code`, `rate`, `base_currency`, `last_updated`
- `quick_add_shortcuts`
  - User shortcut presets: `id`, `user_id`, `label`, `amount`, `currency`, `category`, `type`, `created_at`
- `user_roles`
  - Role control: `id`, `user_id`, `role` (`admin | moderator | user`)

## 2. Current Feature-To-Table Mapping

### Auth / Profile / Onboarding
- Uses `profiles` and `user_roles`.
- Main integration points:
  - `src/hooks/useAuth.tsx`
  - `src/lib/auth/authService.ts`
  - `src/hooks/useLanguage.tsx`
  - `src/hooks/useSettings.tsx`
  - `src/components/layout/Navbar.tsx` (admin role check via `user_roles`)
- Onboarding completion persists in `profiles.has_completed_onboarding`.

### Classic Finance / Finance Page
- Uses `transactions`, `budgets`, `monthly_archives`.
- Main integration points:
  - `src/hooks/useFinance.tsx`
  - `src/pages/Finance.tsx`

### Financial Subscriptions (user spending)
- Uses `subscriptions`, `services`, `subscription_plans`.
- Main integration points:
  - `src/hooks/useSubscriptions.tsx`
  - `src/hooks/subscriptions/api.ts`
  - `src/components/subscription/NewSubscriptionModal.tsx`
  - `src/components/admin/AdminAddSubscriptionModal.tsx`
  - `src/components/admin/AdminSubscriptionManagement.tsx`

### SaaS Billing / Payment Subscription (app plan)
- Uses `user_subscriptions` as primary plan status source, with additional legacy fields in `profiles`.
- Main integration points:
  - `src/hooks/useSubscription.ts`
  - `src/pages/Profile.tsx`
  - `src/pages/PaymentSuccess.tsx`
  - `src/pages/PaymentCancel.tsx`
  - `src/pages/Upgrade.tsx` (`/api/create-checkout`)
  - `src/pages/Profile.tsx` (`/api/billing/customer-portal`)

### Feedback / Admin
- Uses `feedbacks` plus `profiles` for display names.
- Main integration points:
  - `src/hooks/useFeedback.tsx`
  - `src/components/admin/AdminFeedbackPanel.tsx`

### Exchange Rates
- Uses edge function first, falls back to `exchange_rates` table.
- Main integration point:
  - `src/hooks/useExchangeRates.ts`
  - Edge function: `supabase/functions/get-exchange-rates`

### Quick Add Shortcuts
- Table exists in generated types, but no active UI/service usage found in current source scan.

## 3. New AI Module Backend Readiness Matrix

Legend:
- A = Already supported by existing DB
- B = Can partially reuse existing DB now
- C = Needs new migration later
- D = Should stay mock/local for now

| Module | Status | Notes |
|---|---|---|
| Overview AI Command Center | B | Can read current financial signals from `transactions`, `budgets`, `subscriptions`, `monthly_archives`; no dedicated AI state table yet. |
| AI Insights | D | Current `services/core/aiInsightService.ts` is mock-store only; no `ai_insights` table in generated types. |
| Financial Health Score history | D | Current score is computed on the fly; no historical table exists. |
| Goals | D | Goal service intentionally falls back to mock; no `goals` table in generated types. |
| Wallets / Accounts | D | Wallet service intentionally falls back to mock; no `wallets` table in generated types. |
| Smart Budget Planner | B | Can reuse `transactions` + `budgets`; category-level advanced planning may need `budget_categories` later. |
| Monthly Reports | B | Existing `monthly_archives` supports basic monthly snapshots; richer report model needs dedicated schema later. |
| Ruby AI Conversations | D | Current `rubyAIService.ts` is mock-store only; no conversation/message tables in generated types. |
| Predictive Finance | B | Can operate from existing `transactions`, `budgets`, `subscriptions` inputs; persistence for predictions/history is missing. |
| Smart Transaction Intelligence | B | Can infer from `transactions` now; no dedicated annotation/confidence tables yet. |
| Subscription Optimizer | B | Can leverage existing `subscriptions` (+ `services` / `subscription_plans`) for recommendations. |
| Planning Hub | B | Can aggregate existing finance/subscription data now; advanced cross-module persisted planning entities are missing. |
| Settings / App Preferences | B | `profiles.default_currency` and `profiles.language` already persist; broader app preferences remain local for now (no `app_settings` table in generated types). |

## 4. Safe Migration Priority Plan (Do Not Apply Yet)

## High priority
- `goals`
  - Why: unlock real backend for Goals page and planning workflows.
  - Feature owners: Goals, Planning Hub, AI recommendations.
  - Conflict risk: low if isolated and user-owned via `user_id`.
  - Reuse option: none strong in existing schema.
- `wallets`
  - Why: support account-level balances and source attribution.
  - Feature owners: Wallets page, Overview composition, transaction attribution.
  - Conflict risk: low if independent table + foreign keys optional.
  - Reuse option: none strong in existing schema.
- `ai_insights`
  - Why: persist generated insights, resolution status, severity.
  - Feature owners: AI Insights, Overview command feed.
  - Conflict risk: low with user-owned design.
  - Reuse option: limited (`monthly_archives.ai_insight` is too coarse).
- `ruby_ai_conversations`, `ruby_ai_messages`
  - Why: persist chat sessions and message history.
  - Feature owners: Ruby AI page, personalized coaching continuity.
  - Conflict risk: medium (sensitive content governance and RLS required).
  - Reuse option: none in current schema.

## Medium priority
- `monthly_reports`
  - Why: richer reports than current `monthly_archives`.
  - Feature owners: Monthly Reports, analytics export, trend tracking.
  - Conflict risk: medium due to overlap with `monthly_archives`.
  - Reuse option: can continue `monthly_archives` until richer schema is required.
- `financial_health_history`
  - Why: trendline and longitudinal health analytics.
  - Feature owners: Financial Health page, predictive finance.
  - Conflict risk: low.
  - Reuse option: no direct existing equivalent.
- `app_settings`
  - Why: persist non-language/currency preferences (student mode, animations, compact mode, etc.).
  - Feature owners: Settings page and personalization.
  - Conflict risk: low.
  - Reuse option: partial reuse of `profiles` for only simple fields.

## Low priority
- `budget_categories` (if advanced planner categories are needed server-side)
  - Why: category-level planning and risk scoring persistence.
  - Feature owners: Smart Budget Planner advanced mode.
  - Conflict risk: low/medium (can overlap with existing flat `budgets` usage).
  - Reuse option: current `budgets` table can keep baseline functionality.

## 5. Critical Subscription/Payment Boundary (Must Preserve)

- `user_subscriptions` represents app SaaS billing status and LemonSqueezy linkage.
- `subscriptions` represents user financial recurring expenses (Netflix/Spotify style).
- These two concepts must stay separated.
- Do not reuse `user_subscriptions` for personal recurring spend tracking.
- Do not repurpose `subscriptions` table for SaaS entitlement state.

## 6. Service Safety Plan

### Keep real backend integrations as-is
- Auth/session/profile/roles:
  - `useAuth`, `authService`, `profiles`, `user_roles`
- Existing finance:
  - `transactions`, `budgets`, `monthly_archives` via current hooks/pages
- Existing payment/subscription entitlement:
  - `user_subscriptions` and existing checkout/portal endpoints
- Existing recurring spend subscriptions:
  - `subscriptions`, `services`, `subscription_plans`

### Keep mock/local for now (until migrations + regenerated types)
- Goals module
- Wallets module
- AI Insights module
- Ruby AI conversations/messages
- Financial health history persistence
- Rich monthly reports persistence (beyond current `monthly_archives`)
- Extended app settings persistence beyond current `profiles` fields

### Type safety guardrails
- Use only `src/integrations/supabase/types.ts` for table typing.
- Do not call `supabase.from("<table>")` for tables absent in generated types.
- Avoid dynamic table names that degrade type inference.
- Keep one Supabase client source (`src/integrations/supabase/client.ts`).

## 7. Architecture Warnings / Notes

- `src/lib/supabase/schema.ts` and `src/lib/supabase/types.ts` contain forward-looking architecture artifacts, not the deployed generated schema source of truth.
- Any future table activation for AI modules should happen only after:
  1. migration creation,
  2. DB apply,
  3. regenerated `src/integrations/supabase/types.ts`,
  4. service switch from mock to real.
- Existing payment and profile subscription fields in `profiles` should be treated as legacy-compatible fields; authoritative entitlement currently comes from `user_subscriptions` in active plan checks.

## 8. Safe Next Execution Plan (No Changes Applied Yet)

1. Freeze current working auth/payment paths (`profiles`, `user_subscriptions`, checkout/portal endpoints).
2. Introduce migrations in small batches (high priority first: `goals`, `wallets`, `ai_insights`, `ruby_ai_*`).
3. Regenerate Supabase types after each migration batch.
4. Switch each module service from mock to real one-by-one behind existing adapter/fallback structure.
5. Keep feature flags or fallback-to-mock behavior until each module is production-stable.

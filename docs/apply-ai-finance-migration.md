# Apply AI Finance Migration (Manual Only)

This guide is for **manual** migration in Supabase Dashboard only.

- Do not apply from app code.
- Do not run automatic migration commands.
- Do not modify live database objects outside this migration scope.

Target migration file:
- `supabase/migrations/002_ai_finance_modules.sql`

Generated types target file:
- `src/integrations/supabase/types.ts`

## 1. Before Applying

Run these checks first:

1. Confirm the app currently compiles:

```bash
npx tsc --noEmit
npm run build
```

2. Confirm key flows currently work in your environment:
- Auth (login/session/logout)
- Profiles/onboarding
- Existing Classic Finance flows
- Existing payment/subscription flows

3. Confirm you are using the correct Supabase project (environment).
4. Confirm backup/recovery readiness for the target project.
5. Confirm `002_ai_finance_modules.sql` only adds new AI finance module tables and policies.
6. Confirm it does **not** alter existing auth/payment tables and logic (`profiles`, `user_subscriptions`, `subscriptions`, `services`, existing payment integration tables).

## 2. Apply SQL Manually

1. Open [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **correct project** (double-check project name and URL).
3. Go to **SQL Editor**.
4. Open `supabase/migrations/002_ai_finance_modules.sql` locally.
5. Copy/paste full SQL into SQL Editor.
6. Review one last time before execution.
7. Run SQL manually.

Warning:
- Do **not** run this on the wrong Supabase project (for example, production instead of staging).

## 3. Verify Tables

After execution, verify these tables exist in `public`:

- `wallets`
- `goals`
- `ai_insights`
- `ruby_ai_conversations`
- `ruby_ai_messages`
- `monthly_reports`
- `app_settings`
- `financial_health_history`

## 4. Verify RLS

Check Row Level Security is enabled on all new tables above.

Also verify policies exist and follow per-user ownership patterns (for example `user_id = auth.uid()`) and conversation ownership checks for `ruby_ai_messages`.

## 5. Verify Existing Systems Still Work

Manually test:

- Login/session
- Onboarding flow
- Classic Finance pages
- Transactions
- Existing subscriptions/payment system
- Profile page
- Pricing/upgrade/payment flow (if enabled in this environment)

## 6. Regenerate Supabase Types

After migration is applied successfully, regenerate types and write them to the existing file:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/integrations/supabase/types.ts
```

Important:
- Replace `YOUR_PROJECT_ID` with your actual Supabase project ID.
- Do not manually edit generated type output.

## 7. Restart Dev Server

After regenerating types:

1. Stop the running dev server.
2. Start it again.
3. Run TypeScript and build checks:

```bash
npx tsc --noEmit
npm run build
```

## 8. Expected Type Changes

After type regeneration, these tables should appear in `Database` types in `src/integrations/supabase/types.ts`:

- `goals`
- `wallets`
- `ai_insights`
- `ruby_ai_conversations`
- `ruby_ai_messages`
- `monthly_reports`
- `app_settings`
- `financial_health_history`

## 9. Rollback Warning

If something goes wrong:

- Do not randomly drop or modify existing core tables.
- Do not touch auth/payment tables unless part of an approved rollback plan.
- Only consider rolling back newly created AI finance tables if absolutely necessary and after backup confirmation.

## 10. Next Development Step

After migration + type regeneration:

1. Connect Goals and Wallets services first.
2. Then connect AI Insights.
3. Then connect Monthly Reports.
4. Then connect Ruby AI conversations/messages.


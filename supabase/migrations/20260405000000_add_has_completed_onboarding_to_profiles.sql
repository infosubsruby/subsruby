alter table public.profiles
add column if not exists has_completed_onboarding boolean not null default false;

update public.profiles
set has_completed_onboarding = true
where has_completed_onboarding = false;


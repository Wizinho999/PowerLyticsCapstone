-- Create subscriptions table for coaches
create table if not exists public.coach_subscriptions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.profiles(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_name text not null check (plan_name in ('starter', 'basic', 'professional', 'advanced', 'unlimited')),
  athlete_limit integer not null,
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(coach_id)
);

-- Enable RLS
alter table public.coach_subscriptions enable row level security;

-- Coaches can view their own subscription
create policy "Coaches can view own subscription"
  on public.coach_subscriptions for select
  using (coach_id = auth.uid());

-- Coaches can update their own subscription
create policy "Coaches can update own subscription"
  on public.coach_subscriptions for update
  using (coach_id = auth.uid());

-- Create index for faster lookups
create index idx_coach_subscriptions_coach_id on public.coach_subscriptions(coach_id);
create index idx_coach_subscriptions_stripe_customer_id on public.coach_subscriptions(stripe_customer_id);

-- Function to check if coach can add more athletes
create or replace function public.can_coach_add_athlete(p_coach_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_athlete_limit integer;
  v_current_count integer;
begin
  -- Get coach's athlete limit from subscription
  select athlete_limit into v_athlete_limit
  from public.coach_subscriptions
  where coach_id = p_coach_id and status = 'active';
  
  -- If no subscription found, default to 5 athletes (starter plan)
  if v_athlete_limit is null then
    v_athlete_limit := 5;
  end if;
  
  -- Count current athletes
  select count(*) into v_current_count
  from public.coach_athletes
  where coach_id = p_coach_id and status = 'accepted';
  
  -- Return true if under limit
  return v_current_count < v_athlete_limit;
end;
$$;

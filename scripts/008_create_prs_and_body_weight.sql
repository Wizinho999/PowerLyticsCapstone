-- Create athlete PRs (personal records)
create table if not exists public.athlete_prs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  weight decimal(6,2) not null,
  reps int not null,
  e1rm decimal(6,2),
  achieved_at date not null,
  created_at timestamp with time zone default now()
);

alter table public.athlete_prs enable row level security;

create policy "Athletes can view own PRs"
  on public.athlete_prs for select
  using (athlete_id = auth.uid());

create policy "Coaches can view their athletes PRs"
  on public.athlete_prs for select
  using (
    exists (
      select 1 from public.athletes
      where athletes.id = athlete_prs.athlete_id
      and athletes.coach_id = auth.uid()
    )
  );

create policy "Athletes can insert own PRs"
  on public.athlete_prs for insert
  with check (athlete_id = auth.uid());

create policy "Athletes can update own PRs"
  on public.athlete_prs for update
  using (athlete_id = auth.uid());

-- Create body weight logs
create table if not exists public.body_weight_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  weight decimal(5,2) not null,
  recorded_at timestamp with time zone default now()
);

alter table public.body_weight_logs enable row level security;

create policy "Athletes can view own weight logs"
  on public.body_weight_logs for select
  using (athlete_id = auth.uid());

create policy "Coaches can view their athletes weight logs"
  on public.body_weight_logs for select
  using (
    exists (
      select 1 from public.athletes
      where athletes.id = body_weight_logs.athlete_id
      and athletes.coach_id = auth.uid()
    )
  );

create policy "Athletes can insert own weight logs"
  on public.body_weight_logs for insert
  with check (athlete_id = auth.uid());

create policy "Athletes can update own weight logs"
  on public.body_weight_logs for update
  using (athlete_id = auth.uid());

create policy "Athletes can delete own weight logs"
  on public.body_weight_logs for delete
  using (athlete_id = auth.uid());

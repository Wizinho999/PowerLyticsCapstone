-- Create exercise logs (ACTUAL - completed sets)
create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  day_exercise_id uuid not null references public.day_exercises(id) on delete cascade,
  set_number int not null,
  actual_reps int not null,
  actual_weight decimal(6,2) not null,
  actual_rpe decimal(3,1),
  notes text,
  completed_at timestamp with time zone default now()
);

alter table public.exercise_logs enable row level security;

create policy "Athletes can view own logs"
  on public.exercise_logs for select
  using (athlete_id = auth.uid());

create policy "Coaches can view their athletes logs"
  on public.exercise_logs for select
  using (
    exists (
      select 1 from public.athletes
      where athletes.id = exercise_logs.athlete_id
      and athletes.coach_id = auth.uid()
    )
  );

create policy "Athletes can insert own logs"
  on public.exercise_logs for insert
  with check (athlete_id = auth.uid());

create policy "Athletes can update own logs"
  on public.exercise_logs for update
  using (athlete_id = auth.uid());

create policy "Athletes can delete own logs"
  on public.exercise_logs for delete
  using (athlete_id = auth.uid());

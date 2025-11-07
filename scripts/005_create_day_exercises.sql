-- Create day exercises (exercises assigned to a training day)
create table if not exists public.day_exercises (
  id uuid primary key default gen_random_uuid(),
  training_day_id uuid not null references public.training_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  order_index int not null,
  target_sets int not null,
  notes text,
  created_at timestamp with time zone default now()
);

alter table public.day_exercises enable row level security;

create policy "Coaches can view exercises from own blocks"
  on public.day_exercises for select
  using (
    exists (
      select 1 from public.training_days
      join public.training_blocks on training_blocks.id = training_days.block_id
      where training_days.id = day_exercises.training_day_id
      and training_blocks.coach_id = auth.uid()
    )
  );

create policy "Athletes can view exercises from assigned blocks"
  on public.day_exercises for select
  using (
    exists (
      select 1 from public.training_days
      join public.athlete_blocks on athlete_blocks.block_id = training_days.block_id
      where training_days.id = day_exercises.training_day_id
      and athlete_blocks.athlete_id = auth.uid()
    )
  );

create policy "Coaches can create exercises in own blocks"
  on public.day_exercises for insert
  with check (
    exists (
      select 1 from public.training_days
      join public.training_blocks on training_blocks.id = training_days.block_id
      where training_days.id = day_exercises.training_day_id
      and training_blocks.coach_id = auth.uid()
    )
  );

create policy "Coaches can update exercises in own blocks"
  on public.day_exercises for update
  using (
    exists (
      select 1 from public.training_days
      join public.training_blocks on training_blocks.id = training_days.block_id
      where training_days.id = day_exercises.training_day_id
      and training_blocks.coach_id = auth.uid()
    )
  );

create policy "Coaches can delete exercises from own blocks"
  on public.day_exercises for delete
  using (
    exists (
      select 1 from public.training_days
      join public.training_blocks on training_blocks.id = training_days.block_id
      where training_days.id = day_exercises.training_day_id
      and training_blocks.coach_id = auth.uid()
    )
  );

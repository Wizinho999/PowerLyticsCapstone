-- Create exercise sets (TARGET - planned sets)
create table if not exists public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  day_exercise_id uuid not null references public.day_exercises(id) on delete cascade,
  set_number int not null,
  target_reps int not null,
  target_weight decimal(6,2),
  target_rpe decimal(3,1),
  target_percentage decimal(5,2),
  created_at timestamp with time zone default now()
);

alter table public.exercise_sets enable row level security;

create policy "Coaches can view sets from own blocks"
  on public.exercise_sets for select
  using (
    exists (
      select 1 from public.day_exercises
      join public.training_days on training_days.id = day_exercises.training_day_id
      join public.training_blocks on training_blocks.id = training_days.block_id
      where day_exercises.id = exercise_sets.day_exercise_id
      and training_blocks.coach_id = auth.uid()
    )
  );

create policy "Athletes can view sets from assigned blocks"
  on public.exercise_sets for select
  using (
    exists (
      select 1 from public.day_exercises
      join public.training_days on training_days.id = day_exercises.training_day_id
      join public.athlete_blocks on athlete_blocks.block_id = training_days.block_id
      where day_exercises.id = exercise_sets.day_exercise_id
      and athlete_blocks.athlete_id = auth.uid()
    )
  );

create policy "Coaches can create sets in own blocks"
  on public.exercise_sets for insert
  with check (
    exists (
      select 1 from public.day_exercises
      join public.training_days on training_days.id = day_exercises.training_day_id
      join public.training_blocks on training_blocks.id = training_days.block_id
      where day_exercises.id = exercise_sets.day_exercise_id
      and training_blocks.coach_id = auth.uid()
    )
  );

create policy "Coaches can update sets in own blocks"
  on public.exercise_sets for update
  using (
    exists (
      select 1 from public.day_exercises
      join public.training_days on training_days.id = day_exercises.training_day_id
      join public.training_blocks on training_blocks.id = training_days.block_id
      where day_exercises.id = exercise_sets.day_exercise_id
      and training_blocks.coach_id = auth.uid()
    )
  );

create policy "Coaches can delete sets from own blocks"
  on public.exercise_sets for delete
  using (
    exists (
      select 1 from public.day_exercises
      join public.training_days on training_days.id = day_exercises.training_day_id
      join public.training_blocks on training_blocks.id = training_days.block_id
      where day_exercises.id = exercise_sets.day_exercise_id
      and training_blocks.coach_id = auth.uid()
    )
  );

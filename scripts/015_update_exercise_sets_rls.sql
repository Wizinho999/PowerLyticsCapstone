-- Update RLS policies for exercise_sets to allow athletes to manage their own blocks

-- Drop existing policies
drop policy if exists "Athletes can view sets from assigned blocks" on public.exercise_sets;

-- Create new policies for athletes to view sets from their own blocks
create policy "Athletes can view sets from own blocks"
  on public.exercise_sets for select
  using (
    exists (
      select 1 from public.day_exercises
      join public.training_days on training_days.id = day_exercises.training_day_id
      join public.training_blocks on training_blocks.id = training_days.block_id
      where day_exercises.id = exercise_sets.day_exercise_id
      and training_blocks.athlete_id = auth.uid()
    )
    or
    exists (
      select 1 from public.day_exercises
      join public.training_days on training_days.id = day_exercises.training_day_id
      join public.athlete_blocks on athlete_blocks.block_id = training_days.block_id
      where day_exercises.id = exercise_sets.day_exercise_id
      and athlete_blocks.athlete_id = auth.uid()
    )
  );

-- Allow athletes to create sets in their own blocks
create policy "Athletes can create sets in own blocks"
  on public.exercise_sets for insert
  with check (
    exists (
      select 1 from public.day_exercises
      join public.training_days on training_days.id = day_exercises.training_day_id
      join public.training_blocks on training_blocks.id = training_days.block_id
      where day_exercises.id = exercise_sets.day_exercise_id
      and training_blocks.athlete_id = auth.uid()
    )
  );

-- Allow athletes to update sets in their own blocks
create policy "Athletes can update sets in own blocks"
  on public.exercise_sets for update
  using (
    exists (
      select 1 from public.day_exercises
      join public.training_days on training_days.id = day_exercises.training_day_id
      join public.training_blocks on training_blocks.id = training_days.block_id
      where day_exercises.id = exercise_sets.day_exercise_id
      and training_blocks.athlete_id = auth.uid()
    )
  );

-- Allow athletes to delete sets from their own blocks
create policy "Athletes can delete sets from own blocks"
  on public.exercise_sets for delete
  using (
    exists (
      select 1 from public.day_exercises
      join public.training_days on training_days.id = day_exercises.training_day_id
      join public.training_blocks on training_blocks.id = training_days.block_id
      where day_exercises.id = exercise_sets.day_exercise_id
      and training_blocks.athlete_id = auth.uid()
    )
  );

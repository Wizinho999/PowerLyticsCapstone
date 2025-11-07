-- Update RLS policies for day_exercises to allow athletes to manage exercises in their own blocks

-- Add policy for athletes to create exercises in their own blocks
create policy "Athletes can create exercises in own blocks"
  on public.day_exercises for insert
  with check (
    exists (
      select 1 from public.training_days
      join public.training_blocks on training_blocks.id = training_days.block_id
      where training_days.id = day_exercises.training_day_id
      and training_blocks.athlete_id = auth.uid()
    )
  );

-- Add policy for athletes to update exercises in their own blocks
create policy "Athletes can update exercises in own blocks"
  on public.day_exercises for update
  using (
    exists (
      select 1 from public.training_days
      join public.training_blocks on training_blocks.id = training_days.block_id
      where training_days.id = day_exercises.training_day_id
      and training_blocks.athlete_id = auth.uid()
    )
  );

-- Add policy for athletes to delete exercises from their own blocks
create policy "Athletes can delete exercises from own blocks"
  on public.day_exercises for delete
  using (
    exists (
      select 1 from public.training_days
      join public.training_blocks on training_blocks.id = training_days.block_id
      where training_days.id = day_exercises.training_day_id
      and training_blocks.athlete_id = auth.uid()
    )
  );

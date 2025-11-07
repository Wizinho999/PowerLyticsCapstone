-- Allow athletes to view exercises assigned to them in their training blocks

-- Drop existing policy if it exists
drop policy if exists "Athletes can view assigned exercises" on public.exercises;

-- Create policy to allow athletes to view exercises in their assigned blocks
create policy "Athletes can view assigned exercises"
  on public.exercises for select
  using (
    exists (
      select 1
      from public.day_exercises de
      join public.training_days td on td.id = de.training_day_id
      join public.training_blocks tb on tb.id = td.block_id
      join public.athlete_blocks ab on ab.block_id = tb.id
      join public.athletes a on a.id = ab.athlete_id
      where de.exercise_id = exercises.id
        and a.id = auth.uid()
    )
  );

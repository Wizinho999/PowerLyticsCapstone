-- Update RLS policies for training_days to allow athletes to manage their own blocks

-- Drop existing policies
drop policy if exists "Coaches can create days in own blocks" on public.training_days;
drop policy if exists "Coaches can update days in own blocks" on public.training_days;
drop policy if exists "Coaches can delete days from own blocks" on public.training_days;
drop policy if exists "Athletes can view days from assigned blocks" on public.training_days;

-- Update view policy for athletes to include their own blocks
create policy "Athletes can view days from their blocks"
  on public.training_days for select
  using (
    exists (
      select 1 from public.training_blocks
      where training_blocks.id = training_days.block_id
      and (
        training_blocks.athlete_id = auth.uid()
        or exists (
          select 1 from public.athlete_blocks
          where athlete_blocks.block_id = training_blocks.id
          and athlete_blocks.athlete_id = auth.uid()
        )
      )
    )
  );

-- Allow coaches to create days in their blocks
create policy "Coaches can create days in own blocks"
  on public.training_days for insert
  with check (
    exists (
      select 1 from public.training_blocks
      where training_blocks.id = training_days.block_id
      and training_blocks.coach_id = auth.uid()
    )
  );

-- Allow athletes to create days in their own blocks
create policy "Athletes can create days in own blocks"
  on public.training_days for insert
  with check (
    exists (
      select 1 from public.training_blocks
      where training_blocks.id = training_days.block_id
      and training_blocks.athlete_id = auth.uid()
    )
  );

-- Allow coaches to update days in their blocks
create policy "Coaches can update days in own blocks"
  on public.training_days for update
  using (
    exists (
      select 1 from public.training_blocks
      where training_blocks.id = training_days.block_id
      and training_blocks.coach_id = auth.uid()
    )
  );

-- Allow athletes to update days in their own blocks
create policy "Athletes can update days in own blocks"
  on public.training_days for update
  using (
    exists (
      select 1 from public.training_blocks
      where training_blocks.id = training_days.block_id
      and training_blocks.athlete_id = auth.uid()
    )
  );

-- Allow coaches to delete days from their blocks
create policy "Coaches can delete days from own blocks"
  on public.training_days for delete
  using (
    exists (
      select 1 from public.training_blocks
      where training_blocks.id = training_days.block_id
      and training_blocks.coach_id = auth.uid()
    )
  );

-- Allow athletes to delete days from their own blocks
create policy "Athletes can delete days from own blocks"
  on public.training_days for delete
  using (
    exists (
      select 1 from public.training_blocks
      where training_blocks.id = training_days.block_id
      and training_blocks.athlete_id = auth.uid()
    )
  );

-- Modify training_blocks to allow athletes to create their own blocks
-- Make coach_id nullable and add athlete_id
alter table public.training_blocks
  add column if not exists athlete_id uuid references public.athletes(id) on delete cascade;

-- Make coach_id nullable
alter table public.training_blocks
  alter column coach_id drop not null;

-- Add check constraint to ensure either coach_id or athlete_id is set
alter table public.training_blocks
  add constraint training_blocks_creator_check
  check (
    (coach_id is not null and athlete_id is null) or
    (coach_id is null and athlete_id is not null)
  );

-- Update RLS policies for athletes to create and view their own blocks
create policy "Athletes can view own blocks"
  on public.training_blocks for select
  using (athlete_id = auth.uid());

create policy "Athletes can create blocks"
  on public.training_blocks for insert
  with check (athlete_id = auth.uid());

create policy "Athletes can update own blocks"
  on public.training_blocks for update
  using (athlete_id = auth.uid());

create policy "Athletes can delete own blocks"
  on public.training_blocks for delete
  using (athlete_id = auth.uid());

-- Update athlete_blocks policies to allow athletes to self-assign
create policy "Athletes can assign blocks to themselves"
  on public.athlete_blocks for insert
  with check (athlete_id = auth.uid());

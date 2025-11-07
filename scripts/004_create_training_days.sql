-- Create training days
create table if not exists public.training_days (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references public.training_blocks(id) on delete cascade,
  name text not null,
  day_number int not null,
  week_number int not null,
  scheduled_date date,
  created_at timestamp with time zone default now()
);

alter table public.training_days enable row level security;

create policy "Coaches can view days from own blocks"
  on public.training_days for select
  using (
    exists (
      select 1 from public.training_blocks
      where training_blocks.id = training_days.block_id
      and training_blocks.coach_id = auth.uid()
    )
  );

create policy "Athletes can view days from assigned blocks"
  on public.training_days for select
  using (
    exists (
      select 1 from public.athlete_blocks
      where athlete_blocks.block_id = training_days.block_id
      and athlete_blocks.athlete_id = auth.uid()
    )
  );

create policy "Coaches can create days in own blocks"
  on public.training_days for insert
  with check (
    exists (
      select 1 from public.training_blocks
      where training_blocks.id = training_days.block_id
      and training_blocks.coach_id = auth.uid()
    )
  );

create policy "Coaches can update days in own blocks"
  on public.training_days for update
  using (
    exists (
      select 1 from public.training_blocks
      where training_blocks.id = training_days.block_id
      and training_blocks.coach_id = auth.uid()
    )
  );

create policy "Coaches can delete days from own blocks"
  on public.training_days for delete
  using (
    exists (
      select 1 from public.training_blocks
      where training_blocks.id = training_days.block_id
      and training_blocks.coach_id = auth.uid()
    )
  );

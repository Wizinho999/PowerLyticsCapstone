-- Create training blocks
create table if not exists public.training_blocks (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  name text not null,
  description text,
  total_weeks int not null,
  total_days int not null,
  status text not null check (status in ('draft', 'active', 'completed')) default 'draft',
  created_at timestamp with time zone default now()
);

alter table public.training_blocks enable row level security;

create policy "Coaches can view own blocks"
  on public.training_blocks for select
  using (coach_id = auth.uid());

create policy "Coaches can create blocks"
  on public.training_blocks for insert
  with check (coach_id = auth.uid());

create policy "Coaches can update own blocks"
  on public.training_blocks for update
  using (coach_id = auth.uid());

create policy "Coaches can delete own blocks"
  on public.training_blocks for delete
  using (coach_id = auth.uid());

-- Create athlete_blocks (many-to-many relationship)
create table if not exists public.athlete_blocks (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  block_id uuid not null references public.training_blocks(id) on delete cascade,
  start_date date,
  end_date date,
  current_week int default 1,
  status text not null check (status in ('assigned', 'in_progress', 'completed')) default 'assigned',
  created_at timestamp with time zone default now()
);

alter table public.athlete_blocks enable row level security;

create policy "Athletes can view own blocks"
  on public.athlete_blocks for select
  using (athlete_id = auth.uid());

create policy "Coaches can view their athletes blocks"
  on public.athlete_blocks for select
  using (
    exists (
      select 1 from public.athletes
      where athletes.id = athlete_blocks.athlete_id
      and athletes.coach_id = auth.uid()
    )
  );

create policy "Coaches can assign blocks to their athletes"
  on public.athlete_blocks for insert
  with check (
    exists (
      select 1 from public.athletes
      where athletes.id = athlete_blocks.athlete_id
      and athletes.coach_id = auth.uid()
    )
  );

create policy "Athletes can update own block status"
  on public.athlete_blocks for update
  using (athlete_id = auth.uid());

create policy "Coaches can update their athletes blocks"
  on public.athlete_blocks for update
  using (
    exists (
      select 1 from public.athletes
      where athletes.id = athlete_blocks.athlete_id
      and athletes.coach_id = auth.uid()
    )
  );

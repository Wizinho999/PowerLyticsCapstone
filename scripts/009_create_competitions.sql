-- Create competitions
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  name text not null,
  date date not null,
  location text,
  federation text,
  status text not null check (status in ('upcoming', 'in_progress', 'completed')) default 'upcoming',
  created_at timestamp with time zone default now()
);

alter table public.competitions enable row level security;

create policy "Coaches can view own competitions"
  on public.competitions for select
  using (coach_id = auth.uid());

create policy "Coaches can create competitions"
  on public.competitions for insert
  with check (coach_id = auth.uid());

create policy "Coaches can update own competitions"
  on public.competitions for update
  using (coach_id = auth.uid());

create policy "Coaches can delete own competitions"
  on public.competitions for delete
  using (coach_id = auth.uid());

-- Create competition athletes
create table if not exists public.competition_athletes (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  weight_class text,
  status text not null check (status in ('registered', 'confirmed', 'competed')) default 'registered',
  squat_opener decimal(6,2),
  bench_opener decimal(6,2),
  deadlift_opener decimal(6,2),
  gameplan_notes text,
  created_at timestamp with time zone default now()
);

alter table public.competition_athletes enable row level security;

create policy "Athletes can view own competitions"
  on public.competition_athletes for select
  using (athlete_id = auth.uid());

create policy "Coaches can view their athletes competitions"
  on public.competition_athletes for select
  using (
    exists (
      select 1 from public.competitions
      where competitions.id = competition_athletes.competition_id
      and competitions.coach_id = auth.uid()
    )
  );

create policy "Coaches can add athletes to own competitions"
  on public.competition_athletes for insert
  with check (
    exists (
      select 1 from public.competitions
      where competitions.id = competition_athletes.competition_id
      and competitions.coach_id = auth.uid()
    )
  );

create policy "Coaches can update athletes in own competitions"
  on public.competition_athletes for update
  using (
    exists (
      select 1 from public.competitions
      where competitions.id = competition_athletes.competition_id
      and competitions.coach_id = auth.uid()
    )
  );

create policy "Coaches can remove athletes from own competitions"
  on public.competition_athletes for delete
  using (
    exists (
      select 1 from public.competitions
      where competitions.id = competition_athletes.competition_id
      and competitions.coach_id = auth.uid()
    )
  );

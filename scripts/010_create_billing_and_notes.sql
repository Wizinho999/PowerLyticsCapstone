-- Create billing
create table if not exists public.billing (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  amount decimal(10,2) not null,
  due_date date not null,
  paid_date date,
  status text not null check (status in ('pending', 'paid', 'overdue', 'cancelled')) default 'pending',
  payment_method text,
  notes text,
  created_at timestamp with time zone default now()
);

alter table public.billing enable row level security;

create policy "Coaches can view own billing"
  on public.billing for select
  using (coach_id = auth.uid());

create policy "Athletes can view own billing"
  on public.billing for select
  using (athlete_id = auth.uid());

create policy "Coaches can create billing for their athletes"
  on public.billing for insert
  with check (
    coach_id = auth.uid() and
    exists (
      select 1 from public.athletes
      where athletes.id = billing.athlete_id
      and athletes.coach_id = auth.uid()
    )
  );

create policy "Coaches can update own billing"
  on public.billing for update
  using (coach_id = auth.uid());

create policy "Coaches can delete own billing"
  on public.billing for delete
  using (coach_id = auth.uid());

-- Create notes
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid references public.athletes(id) on delete cascade,
  content text not null,
  category text not null check (category in ('general', 'training', 'nutrition', 'recovery')),
  created_at timestamp with time zone default now()
);

alter table public.notes enable row level security;

create policy "Users can view own notes"
  on public.notes for select
  using (author_id = auth.uid() or athlete_id = auth.uid());

create policy "Coaches can view notes about their athletes"
  on public.notes for select
  using (
    exists (
      select 1 from public.athletes
      where athletes.id = notes.athlete_id
      and athletes.coach_id = auth.uid()
    )
  );

create policy "Users can create own notes"
  on public.notes for insert
  with check (author_id = auth.uid());

create policy "Users can update own notes"
  on public.notes for update
  using (author_id = auth.uid());

create policy "Users can delete own notes"
  on public.notes for delete
  using (author_id = auth.uid());

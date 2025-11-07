-- Create exercises library
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  video_url text,
  created_by uuid references public.coaches(id) on delete set null,
  is_public boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.exercises enable row level security;

create policy "Everyone can view public exercises"
  on public.exercises for select
  using (is_public = true);

create policy "Coaches can view own exercises"
  on public.exercises for select
  using (created_by = auth.uid());

create policy "Coaches can create exercises"
  on public.exercises for insert
  with check (created_by = auth.uid());

create policy "Coaches can update own exercises"
  on public.exercises for update
  using (created_by = auth.uid());

create policy "Coaches can delete own exercises"
  on public.exercises for delete
  using (created_by = auth.uid());

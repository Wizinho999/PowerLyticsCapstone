-- Create profiles table extending auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('athlete', 'coach')),
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create coaches table
create table if not exists public.coaches (
  id uuid primary key references public.profiles(id) on delete cascade,
  business_name text,
  specialization text,
  total_athletes int default 0,
  created_at timestamp with time zone default now()
);

alter table public.coaches enable row level security;

create policy "Coaches can view own data"
  on public.coaches for select
  using (auth.uid() = id);

create policy "Coaches can update own data"
  on public.coaches for update
  using (auth.uid() = id);

create policy "Coaches can insert own data"
  on public.coaches for insert
  with check (auth.uid() = id);

-- Create athletes table
create table if not exists public.athletes (
  id uuid primary key references public.profiles(id) on delete cascade,
  coach_id uuid references public.coaches(id) on delete set null,
  date_of_birth date,
  weight decimal(5,2),
  height decimal(5,2),
  created_at timestamp with time zone default now()
);

alter table public.athletes enable row level security;

create policy "Athletes can view own data"
  on public.athletes for select
  using (auth.uid() = id);

create policy "Coaches can view their athletes"
  on public.athletes for select
  using (coach_id = auth.uid());

create policy "Athletes can update own data"
  on public.athletes for update
  using (auth.uid() = id);

create policy "Coaches can update their athletes"
  on public.athletes for update
  using (coach_id = auth.uid());

create policy "Athletes can insert own data"
  on public.athletes for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'athlete')
  )
  on conflict (id) do nothing;

  -- If role is coach, create coach record
  if (new.raw_user_meta_data ->> 'role') = 'coach' then
    insert into public.coaches (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  -- If role is athlete, create athlete record
  if (new.raw_user_meta_data ->> 'role') = 'athlete' then
    insert into public.athletes (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

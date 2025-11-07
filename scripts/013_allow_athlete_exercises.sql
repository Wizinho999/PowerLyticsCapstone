-- Allow athletes to create exercises
-- Drop existing foreign key constraint
alter table public.exercises drop constraint if exists exercises_created_by_fkey;

-- Change created_by to reference profiles instead of coaches
-- This allows both coaches and athletes to create exercises
alter table public.exercises 
  add constraint exercises_created_by_fkey 
  foreign key (created_by) 
  references public.profiles(id) 
  on delete set null;

-- Update RLS policies to allow athletes to create exercises
drop policy if exists "Coaches can create exercises" on public.exercises;
drop policy if exists "Coaches can view own exercises" on public.exercises;
drop policy if exists "Coaches can update own exercises" on public.exercises;
drop policy if exists "Coaches can delete own exercises" on public.exercises;

-- New policies for both coaches and athletes
create policy "Users can view own exercises"
  on public.exercises for select
  using (created_by = auth.uid() or is_public = true);

create policy "Users can create exercises"
  on public.exercises for insert
  with check (created_by = auth.uid());

create policy "Users can update own exercises"
  on public.exercises for update
  using (created_by = auth.uid());

create policy "Users can delete own exercises"
  on public.exercises for delete
  using (created_by = auth.uid());

-- Allow coaches to view profiles of their athletes
-- This enables coaches to see the names and emails of athletes they manage

create policy "Coaches can view their athletes' profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.athletes
      where athletes.id = profiles.id
      and athletes.coach_id = auth.uid()
    )
  );

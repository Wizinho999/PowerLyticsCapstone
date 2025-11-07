-- Allow athletes to view basic coach information from invitations
-- This enables athletes to see the coach's name when they receive an invitation

create policy "Athletes can view coaches who invited them"
  on public.coaches for select
  using (
    exists (
      select 1 from public.coach_invitations
      where coach_invitations.coach_id = coaches.id
      and coach_invitations.athlete_email = (
        select email from public.profiles where id = auth.uid()
      )
    )
  );

-- Also allow athletes to view their assigned coach
create policy "Athletes can view their assigned coach"
  on public.coaches for select
  using (
    exists (
      select 1 from public.athletes
      where athletes.coach_id = coaches.id
      and athletes.id = auth.uid()
    )
  );

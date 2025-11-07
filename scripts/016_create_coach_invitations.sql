-- Create coach invitations table
create table if not exists public.coach_invitations (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  athlete_email text not null,
  athlete_id uuid references public.athletes(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  message text,
  created_at timestamp with time zone default now(),
  responded_at timestamp with time zone
);

-- Enable RLS
alter table public.coach_invitations enable row level security;

-- Coaches can view their own invitations
create policy "Coaches can view own invitations"
  on public.coach_invitations for select
  using (coach_id = auth.uid());

-- Coaches can create invitations
create policy "Coaches can create invitations"
  on public.coach_invitations for insert
  with check (coach_id = auth.uid());

-- Athletes can view invitations sent to their email
create policy "Athletes can view invitations to their email"
  on public.coach_invitations for select
  using (
    athlete_email = (select email from public.profiles where id = auth.uid())
    or athlete_id = auth.uid()
  );

-- Athletes can update invitations sent to them (accept/reject)
create policy "Athletes can respond to invitations"
  on public.coach_invitations for update
  using (
    athlete_email = (select email from public.profiles where id = auth.uid())
    or athlete_id = auth.uid()
  );

-- Function to accept invitation and link athlete to coach
create or replace function public.accept_coach_invitation(invitation_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_coach_id uuid;
  v_athlete_id uuid;
begin
  -- Get invitation details
  select coach_id, athlete_id into v_coach_id, v_athlete_id
  from public.coach_invitations
  where id = invitation_id
  and status = 'pending';

  if v_coach_id is null then
    raise exception 'Invitation not found or already processed';
  end if;

  -- Update athlete's coach_id
  update public.athletes
  set coach_id = v_coach_id
  where id = auth.uid();

  -- Update invitation status
  update public.coach_invitations
  set 
    status = 'accepted',
    athlete_id = auth.uid(),
    responded_at = now()
  where id = invitation_id;

  -- Increment coach's total_athletes count
  update public.coaches
  set total_athletes = total_athletes + 1
  where id = v_coach_id;
end;
$$;

-- Function to reject invitation
create or replace function public.reject_coach_invitation(invitation_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.coach_invitations
  set 
    status = 'rejected',
    athlete_id = auth.uid(),
    responded_at = now()
  where id = invitation_id
  and status = 'pending'
  and (
    athlete_email = (select email from public.profiles where id = auth.uid())
    or athlete_id = auth.uid()
  );
end;
$$;

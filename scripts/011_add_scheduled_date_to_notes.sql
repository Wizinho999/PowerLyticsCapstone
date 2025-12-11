-- Add scheduled_date field to notes table for calendar integration
alter table public.notes
add column if not exists scheduled_date date;

-- Create index for better query performance
create index if not exists idx_notes_scheduled_date 
on public.notes(scheduled_date);

-- Create index for athlete + date queries
create index if not exists idx_notes_athlete_date 
on public.notes(athlete_id, scheduled_date);

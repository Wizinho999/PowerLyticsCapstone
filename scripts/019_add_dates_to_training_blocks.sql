-- Add start_date and end_date columns to training_blocks
alter table public.training_blocks
add column if not exists start_date date,
add column if not exists end_date date;

-- Update existing blocks to have reasonable dates if needed
update public.training_blocks
set start_date = created_at::date
where start_date is null;

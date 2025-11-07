-- Add target columns to day_exercises table for coach-defined targets
alter table public.day_exercises
  add column if not exists target_reps int,
  add column if not exists target_rpe decimal(3,1),
  add column if not exists target_weight decimal(6,2);

-- Add comment explaining the columns
comment on column public.day_exercises.target_reps is 'Target repetitions set by coach';
comment on column public.day_exercises.target_rpe is 'Target RPE (Rate of Perceived Exertion) set by coach';
comment on column public.day_exercises.target_weight is 'Target weight set by coach';

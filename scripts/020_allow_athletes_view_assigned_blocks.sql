-- Allow athletes to view blocks assigned to them
create policy "Athletes can view assigned blocks"
  on public.training_blocks for select
  using (
    exists (
      select 1 from public.athlete_blocks
      where athlete_blocks.block_id = training_blocks.id
      and athlete_blocks.athlete_id = auth.uid()
    )
  );

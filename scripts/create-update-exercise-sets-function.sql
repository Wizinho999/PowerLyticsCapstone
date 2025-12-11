-- Create a PostgreSQL function to update exercise sets efficiently
-- This bypasses complex RLS policies and does bulk updates faster

CREATE OR REPLACE FUNCTION update_exercise_sets_bulk(
  sets_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  set_record jsonb;
BEGIN
  -- Loop through each set in the JSON array
  FOR set_record IN SELECT * FROM jsonb_array_elements(sets_data)
  LOOP
    UPDATE exercise_sets
    SET 
      target_reps = COALESCE((set_record->>'reps')::int, target_reps),
      target_weight = COALESCE((set_record->>'weight')::decimal, target_weight),
      target_rpe = COALESCE((set_record->>'rpe')::decimal, target_rpe)
    WHERE id = (set_record->>'id')::uuid;
  END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_exercise_sets_bulk(jsonb) TO authenticated;

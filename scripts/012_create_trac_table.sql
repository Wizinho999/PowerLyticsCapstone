-- Create TRAC (Training Recovery Assessment and Control) table
CREATE TABLE IF NOT EXISTS trac_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Soreness metrics (0-10)
  leg_soreness INTEGER CHECK (leg_soreness >= 0 AND leg_soreness <= 10),
  push_soreness INTEGER CHECK (push_soreness >= 0 AND push_soreness <= 10),
  pull_soreness INTEGER CHECK (pull_soreness >= 0 AND pull_soreness <= 10),
  
  -- Recovery metrics (0-10)
  sleep_nutrition INTEGER CHECK (sleep_nutrition >= 0 AND sleep_nutrition <= 10),
  perceived_recovery INTEGER CHECK (perceived_recovery >= 0 AND perceived_recovery <= 10),
  
  -- After workout day metrics (0-10)
  motivation INTEGER CHECK (motivation >= 0 AND motivation <= 10),
  technical_comfort INTEGER CHECK (technical_comfort >= 0 AND technical_comfort <= 10),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trac_logs_athlete_date ON trac_logs(athlete_id, recorded_date DESC);

-- Enable Row Level Security
ALTER TABLE trac_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Athletes can only see their own TRAC logs
CREATE POLICY "Athletes can view own trac logs"
  ON trac_logs FOR SELECT
  USING (auth.uid() = athlete_id);

-- Policy: Athletes can insert their own TRAC logs
CREATE POLICY "Athletes can insert own trac logs"
  ON trac_logs FOR INSERT
  WITH CHECK (auth.uid() = athlete_id);

-- Policy: Athletes can update their own TRAC logs
CREATE POLICY "Athletes can update own trac logs"
  ON trac_logs FOR UPDATE
  USING (auth.uid() = athlete_id);

-- Policy: Athletes can delete their own TRAC logs
CREATE POLICY "Athletes can delete own trac logs"
  ON trac_logs FOR DELETE
  USING (auth.uid() = athlete_id);

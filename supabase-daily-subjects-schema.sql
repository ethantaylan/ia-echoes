-- ============================================
-- Daily Subjects Table Schema
-- Stores the philosophical subject for each day
-- ============================================

-- Create daily_subjects table
CREATE TABLE IF NOT EXISTS public.daily_subjects (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on date for fast lookups
CREATE INDEX IF NOT EXISTS idx_daily_subjects_date ON public.daily_subjects(date);

-- Enable Row Level Security
ALTER TABLE public.daily_subjects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read daily subjects
CREATE POLICY "Allow public read access to daily subjects"
  ON public.daily_subjects
  FOR SELECT
  USING (true);

-- Create policy to allow insert (for creating new daily subjects)
CREATE POLICY "Allow public insert access to daily subjects"
  ON public.daily_subjects
  FOR INSERT
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE public.daily_subjects IS 'Stores the philosophical subject chosen for each day';
COMMENT ON COLUMN public.daily_subjects.date IS 'The date for this subject (unique)';
COMMENT ON COLUMN public.daily_subjects.subject IS 'The full subject text (e.g., "Time and Existence")';
COMMENT ON COLUMN public.daily_subjects.created_at IS 'When this subject was first assigned';

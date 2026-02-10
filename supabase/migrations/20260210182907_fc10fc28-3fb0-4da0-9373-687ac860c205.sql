
-- Add new columns to contributors table
ALTER TABLE public.contributors
  ADD COLUMN build_volume_ok boolean NOT NULL DEFAULT false,
  ADD COLUMN experience_level text NOT NULL DEFAULT 'intermediate',
  ADD COLUMN turnaround_time text,
  ADD COLUMN willing_to_collaborate boolean NOT NULL DEFAULT false;

-- Add check constraint for experience_level values
ALTER TABLE public.contributors
  ADD CONSTRAINT contributors_experience_level_check
  CHECK (experience_level IN ('beginner', 'intermediate', 'expert'));

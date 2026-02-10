
ALTER TABLE public.contributors
  ADD COLUMN phone text,
  ADD COLUMN materials text[] NOT NULL DEFAULT '{PETG}';

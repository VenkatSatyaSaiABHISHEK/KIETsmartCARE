-- 1. Create problem_categories table
CREATE TABLE IF NOT EXISTS public.problem_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed institutional problem categories
INSERT INTO public.problem_categories (name, sort_order)
VALUES
  ('Headache', 1),
  ('Body pain', 2),
  ('Fever', 3),
  ('Cold and cough', 4),
  ('Stomach pain', 5),
  ('Vomiting', 6),
  ('Sore throat', 7),
  ('Injury', 8),
  ('Other', 9)
ON CONFLICT (name) DO UPDATE SET sort_order = EXCLUDED.sort_order;

-- 2. Alter students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS residence_type TEXT CHECK (residence_type IN ('hostler', 'day_scholar'));
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_path TEXT;

-- 3. Alter visits table
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS problems TEXT[];
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS other_problem TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS consultation_seconds INT DEFAULT 0;

-- 4. Alter visit_medications table
ALTER TABLE public.visit_medications ALTER COLUMN medicine_id DROP NOT NULL;
ALTER TABLE public.visit_medications ADD COLUMN IF NOT EXISTS label TEXT;

-- 5. Seed sample residence data for existing students
UPDATE public.students SET residence_type = 'hostler', room_number = 'B-214' WHERE roll_number = '2200290120019';
UPDATE public.students SET residence_type = 'day_scholar', room_number = NULL WHERE roll_number = '2200290120020';
UPDATE public.students SET residence_type = 'hostler', room_number = 'C-108' WHERE roll_number = '2300290100045';


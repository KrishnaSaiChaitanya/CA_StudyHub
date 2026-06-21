-- Update subscriptions table to include plan_name and expiry_date
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan_name TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;

-- Create exam_date table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exam_date (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_name TEXT NOT NULL,
  last_exam_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a default exam date for testing if needed
INSERT INTO public.exam_date (attempt_name, last_exam_date)
VALUES ('May 2026 Attempt', '2026-05-30')
ON CONFLICT DO NOTHING;

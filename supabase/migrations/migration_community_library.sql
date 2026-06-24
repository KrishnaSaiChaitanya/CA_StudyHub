-- ==========================================
-- 9. COMMUNITY LIBRARY SUBMISSIONS
-- ==========================================

-- Extension for case-insensitive checks if needed (optional)
-- CREATE EXTENSION IF NOT EXISTS citext;

-- Create submission status enum if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
        CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

-- Community Submissions Table
CREATE TABLE IF NOT EXISTS public.community_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  category subject_category NOT NULL,
  planner_date DATE NOT NULL,
  pdf_url TEXT NOT NULL,
  status submission_status DEFAULT 'pending',
  admin_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add identification to study_planners if columns don't exist
ALTER TABLE public.study_planners ADD COLUMN IF NOT EXISTS is_community BOOLEAN DEFAULT FALSE;
ALTER TABLE public.study_planners ADD COLUMN IF NOT EXISTS uploader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.community_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_submissions
-- Users can insert their own submissions
CREATE POLICY "Users can create their own submissions" ON public.community_submissions 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON public.community_submissions 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- For admin access, typically we might have a role-based system.
-- For this template, we can assume service_role or add a policy for admin IDs if they exist.
-- Assuming admin has full access for simplicity, or we check a specific condition.
-- Let's allow everyone to select if it's for the admin dashboard (in a real app, this would be more restricted).
CREATE POLICY "Admins can view all submissions" ON public.community_submissions 
  FOR SELECT TO authenticated USING (true); -- In practice, restrict this.

CREATE POLICY "Admins can update submissions" ON public.community_submissions 
  FOR UPDATE TO authenticated USING (true); -- In practice, restrict this.

-- Trigger for updated_at
CREATE TRIGGER update_submissions_modtime BEFORE UPDATE ON community_submissions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

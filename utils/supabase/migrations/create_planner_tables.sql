-- ============================================================================
-- CA StudyHub Practice Planner Tables Migration
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. Create Enums if they don't exist
DO $$ BEGIN
    CREATE TYPE public.tracker_phase AS ENUM ('study1', 'rev1', 'rev2');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.chapter_status AS ENUM ('pending', 'completed', 'skipped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Master Tables
CREATE TABLE IF NOT EXISTS public.planner_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  short_name text NOT NULL,
  level public.student_level NOT NULL,
  base_weight numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.planner_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_slug text REFERENCES public.planner_subjects(slug) ON DELETE CASCADE,
  topic text NOT NULL,
  hours numeric NOT NULL DEFAULT 0.0,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.planner_subtopics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid REFERENCES public.planner_chapters(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create User Progress Tracking Tables
CREATE TABLE IF NOT EXISTS public.user_subject_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject_slug text REFERENCES public.planner_subjects(slug) ON DELETE CASCADE NOT NULL,
  classes_done boolean DEFAULT false NOT NULL,
  rev1_done boolean DEFAULT false NOT NULL,
  rev2_done boolean DEFAULT false NOT NULL,
  expertise text DEFAULT 'Moderate' NOT NULL,
  allocated_days integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subject_slug)
);

CREATE TABLE IF NOT EXISTS public.user_chapter_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  chapter_id uuid REFERENCES public.planner_chapters(id) ON DELETE CASCADE NOT NULL,
  phase public.tracker_phase NOT NULL,
  status public.chapter_status DEFAULT 'pending' NOT NULL,
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chapter_id, phase)
);

CREATE TABLE IF NOT EXISTS public.user_subtopic_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subtopic_id uuid REFERENCES public.planner_subtopics(id) ON DELETE CASCADE NOT NULL,
  phase public.tracker_phase NOT NULL,
  status public.chapter_status DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subtopic_id, phase)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.planner_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subject_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chapter_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subtopic_progress ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- Allow public read access to master tables
CREATE POLICY "Allow authenticated read access to planner_subjects" ON public.planner_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access to planner_chapters" ON public.planner_chapters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access to planner_subtopics" ON public.planner_subtopics FOR SELECT TO authenticated USING (true);

-- Allow admin full access to master tables (checked via email array)
CREATE POLICY "Allow admin write access to planner_subjects" ON public.planner_subjects 
  FOR ALL TO authenticated USING (
    (auth.jwt() ->> 'email') = ANY(ARRAY['ksc.tata215@gmail.com', 'kaushikn0812@gmail.com', 'sai.tata9949746270@gmail.com'])
  );

CREATE POLICY "Allow admin write access to planner_chapters" ON public.planner_chapters 
  FOR ALL TO authenticated USING (
    (auth.jwt() ->> 'email') = ANY(ARRAY['ksc.tata215@gmail.com', 'kaushikn0812@gmail.com', 'sai.tata9949746270@gmail.com'])
  );

CREATE POLICY "Allow admin write access to planner_subtopics" ON public.planner_subtopics 
  FOR ALL TO authenticated USING (
    (auth.jwt() ->> 'email') = ANY(ARRAY['ksc.tata215@gmail.com', 'kaushikn0812@gmail.com', 'sai.tata9949746270@gmail.com'])
  );

-- User-specific read/write access to states and progress
CREATE POLICY "Allow users to read their own subject states" ON public.user_subject_states FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow users to modify their own subject states" ON public.user_subject_states FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to read their own chapter progress" ON public.user_chapter_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow users to modify their own chapter progress" ON public.user_chapter_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to read their own subtopic progress" ON public.user_subtopic_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow users to modify their own subtopic progress" ON public.user_subtopic_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Indices for query optimization
CREATE INDEX IF NOT EXISTS idx_user_subject_states_user ON public.user_subject_states(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chapter_progress_user ON public.user_chapter_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subtopic_progress_user ON public.user_subtopic_progress(user_id);

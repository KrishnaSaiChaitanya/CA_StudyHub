-- Update user_bookmarks to support practice papers and questions
-- This assumes practice_papers table exists (as referenced in components/PracticePapers.tsx)

-- 1. Ensure practice_papers table exists if not already defined
CREATE TABLE IF NOT EXISTS public.practice_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject subject_category NOT NULL,
  exam_year TEXT NOT NULL,
  level student_level NOT NULL,
  pages INT DEFAULT 0,
  type TEXT NOT NULL, -- 'mtp', 'rtp', 'pyq'
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Modify user_bookmarks to handle different types of bookmarks
-- Remove potential composite PK that only handles planners
ALTER TABLE public.user_bookmarks DROP CONSTRAINT IF EXISTS user_bookmarks_pkey;

-- Add surrogate PK and other ID columns
ALTER TABLE public.user_bookmarks ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE public.user_bookmarks ADD COLUMN IF NOT EXISTS practice_paper_id UUID REFERENCES public.practice_papers(id) ON DELETE CASCADE;
ALTER TABLE public.user_bookmarks ADD COLUMN IF NOT EXISTS question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE;
ALTER TABLE public.user_bookmarks ADD COLUMN IF NOT EXISTS spom_material_id TEXT;

-- 3. Ensure a user can't bookmark the same item twice
DROP INDEX IF EXISTS idx_user_planner_bookmark;
DROP INDEX IF EXISTS idx_user_paper_bookmark;
DROP INDEX IF EXISTS idx_user_question_bookmark;
DROP INDEX IF EXISTS idx_user_spom_material_bookmark;
CREATE UNIQUE INDEX idx_user_planner_bookmark ON public.user_bookmarks (user_id, planner_id) WHERE planner_id IS NOT NULL;
CREATE UNIQUE INDEX idx_user_paper_bookmark ON public.user_bookmarks (user_id, practice_paper_id) WHERE practice_paper_id IS NOT NULL;
CREATE UNIQUE INDEX idx_user_question_bookmark ON public.user_bookmarks (user_id, question_id) WHERE question_id IS NOT NULL;
CREATE UNIQUE INDEX idx_user_spom_material_bookmark ON public.user_bookmarks (user_id, spom_material_id) WHERE spom_material_id IS NOT NULL;

-- 4. Constraint to ensure exactly one item type is bookmarked per record
ALTER TABLE public.user_bookmarks DROP CONSTRAINT IF EXISTS at_least_one_id;
ALTER TABLE public.user_bookmarks ADD CONSTRAINT at_least_one_id CHECK (
    (planner_id IS NOT NULL AND practice_paper_id IS NULL AND question_id IS NULL AND spom_material_id IS NULL) OR
    (planner_id IS NULL AND practice_paper_id IS NOT NULL AND question_id IS NULL AND spom_material_id IS NULL) OR
    (planner_id IS NULL AND practice_paper_id IS NULL AND question_id IS NOT NULL AND spom_material_id IS NULL) OR
    (planner_id IS NULL AND practice_paper_id IS NULL AND question_id IS NULL AND spom_material_id IS NOT NULL)
);

-- 5. RLS Policies (ensure they cover all operations for the owner)
-- The existing policy for user_bookmarks usually covers CRUD for user_id = auth.uid()
-- If not, recreate it:
DROP POLICY IF EXISTS "Users manage own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users manage own bookmarks" ON public.user_bookmarks FOR ALL USING (auth.uid() = user_id);

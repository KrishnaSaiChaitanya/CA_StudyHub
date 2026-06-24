-- Migration for Flashcards Feature

-- 1. Create Tables

-- Flashcard Folders
CREATE TABLE public.flashcard_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Flashcard Sets
CREATE TABLE public.flashcard_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject public.subject_category DEFAULT 'general'::public.subject_category NOT NULL,
  is_admin boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Flashcards (cards inside a set)
CREATE TABLE public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid REFERENCES public.flashcard_sets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  position integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Junction table: folders <-> sets (for organization)
CREATE TABLE public.flashcard_folder_sets (
  folder_id uuid REFERENCES public.flashcard_folders(id) ON DELETE CASCADE NOT NULL,
  set_id uuid REFERENCES public.flashcard_sets(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (folder_id, set_id)
);

-- Topic Requests from users to admins
CREATE TABLE public.flashcard_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  topic text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Triggers for updated_at
CREATE TRIGGER tr_update_flashcard_folders BEFORE UPDATE ON public.flashcard_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_update_flashcard_sets BEFORE UPDATE ON public.flashcard_sets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_update_flashcards BEFORE UPDATE ON public.flashcards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Indexes for performance
CREATE INDEX idx_flashcard_folders_user_id ON public.flashcard_folders(user_id);
CREATE INDEX idx_flashcard_sets_user_id ON public.flashcard_sets(user_id);
CREATE INDEX idx_flashcards_set_id ON public.flashcards(set_id);
CREATE INDEX idx_flashcard_folder_sets_set_id ON public.flashcard_folder_sets(set_id);
CREATE INDEX idx_flashcard_requests_user_id ON public.flashcard_requests(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.flashcard_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_folder_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_requests ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Flashcard Folders
CREATE POLICY "Users can manage their own folders" ON public.flashcard_folders
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Flashcard Folder Sets (junction table)
CREATE POLICY "Users can manage sets inside their own folders" ON public.flashcard_folder_sets
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.flashcard_folders
      WHERE id = folder_id AND user_id = auth.uid()
    )
  );

-- Flashcard Sets
CREATE POLICY "Users can view admin sets or their own sets" ON public.flashcard_sets
  FOR SELECT TO authenticated USING (is_admin = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own sets or admins can create admin sets" ON public.flashcard_sets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR is_admin = true);

CREATE POLICY "Users can edit or delete their own sets or admins can manage admin sets" ON public.flashcard_sets
  FOR ALL TO authenticated USING (auth.uid() = user_id OR is_admin = true);

-- Flashcards
CREATE POLICY "Users can view cards in sets they have access to" ON public.flashcards
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.flashcard_sets
      WHERE id = set_id AND (is_admin = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage cards in sets they own" ON public.flashcards
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.flashcard_sets
      WHERE id = set_id AND (user_id = auth.uid() OR is_admin = true)
    )
  );

-- Flashcard Requests
CREATE POLICY "Authenticated users can create requests" ON public.flashcard_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users and admins can view requests" ON public.flashcard_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own requests" ON public.flashcard_requests
  FOR ALL TO authenticated USING (auth.uid() = user_id);


-- 6. Seed Sample Admin Flashcard Sets and Cards
DO $$
DECLARE
  v_set1_id uuid := '11111111-1111-1111-1111-111111111111';
  v_set2_id uuid := '22222222-2222-2222-2222-222222222222';
  v_set3_id uuid := '33333333-3333-3333-3333-333333333333';
BEGIN
  -- Seed Set 1
  INSERT INTO public.flashcard_sets (id, user_id, title, subject, is_admin)
  VALUES (v_set1_id, NULL, 'AS 22 — Deferred Tax Essentials', 'financial_reporting', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.flashcards (set_id, front, back, position)
  VALUES 
    (v_set1_id, 'What is timing difference under AS 22?', 'Difference between accounting income and taxable income for a period that originates in one period and is capable of reversal in subsequent periods.', 0),
    (v_set1_id, 'When should DTA be recognised?', 'Only when there is reasonable certainty (or virtual certainty in case of unabsorbed depreciation/losses) that sufficient future taxable income will be available.', 1),
    (v_set1_id, 'DTL on revaluation reserve?', 'Recognised in the revaluation reserve itself, not P&L.', 2)
  ON CONFLICT DO NOTHING;

  -- Seed Set 2
  INSERT INTO public.flashcard_sets (id, user_id, title, subject, is_admin)
  VALUES (v_set2_id, NULL, 'GST — Input Tax Credit Rules', 'taxation', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.flashcards (set_id, front, back, position)
  VALUES 
    (v_set2_id, 'Section 16(4) ITC time limit?', '30th November of the following financial year (post Finance Act 2024).', 0),
    (v_set2_id, 'Blocked credits under Section 17(5)?', 'Motor vehicles (with exceptions), food & beverages, club memberships, works contract for immovable property, etc.', 1)
  ON CONFLICT DO NOTHING;

  -- Seed Set 3
  INSERT INTO public.flashcard_sets (id, user_id, title, subject, is_admin)
  VALUES (v_set3_id, NULL, 'Companies Act — Key Sections', 'corporate_and_other_laws', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.flashcards (set_id, front, back, position)
  VALUES 
    (v_set3_id, 'Section 149 deals with?', 'Composition of Board of Directors — minimum/maximum directors, woman director, independent directors.', 0)
  ON CONFLICT DO NOTHING;
END $$;

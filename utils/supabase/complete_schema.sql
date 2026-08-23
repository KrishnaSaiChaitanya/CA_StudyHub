-- ============================================================================
-- CA StudyHub Complete Schema Migration
-- Unified Single Source of Truth Schema
-- ============================================================================

-- 1. CREATE CUSTOM ENUM TYPES & EXTENSIONS
CREATE TYPE public.student_level AS ENUM ('foundation', 'intermediate', 'final');
CREATE TYPE public.todo_status AS ENUM ('pending', 'completed');
CREATE TYPE public.mcq_option AS ENUM ('A', 'B', 'C', 'D');
CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.event_category AS ENUM ('Exam', 'Mocks', 'Deadlines', 'Sessions');
CREATE TYPE public.test_level_type AS ENUM ('standard', 'intermediate', 'advanced');
CREATE TYPE public.paper_type AS ENUM ('rtp', 'pyq', 'mtp', 'online');

CREATE TYPE public.subject_category AS ENUM (
  'general', 'principles_and_practice_of_accounting', 'business_laws', 
  'business_math_logical_reasoning_and_statistics', 'business_economics', 
  'advanced_accounting', 'corporate_and_other_laws', 'taxation', 
  'cost_and_management_accounting', 'auditing_and_ethics', 
  'financial_management_and_strategic_management', 'financial_reporting', 
  'advanced_financial_management', 'advanced_auditing_assurance_and_professional_ethics', 
  'direct_tax_laws', 'indirect_tax_laws', 'integrated_business_solutions'
);

-- ============================================================================
-- 2. TABLE DEFINITIONS (Ordered by Foreign Key Dependencies)
-- ============================================================================

-- Profiles (Linked to Supabase Auth)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_type public.student_level,
  current_streak integer DEFAULT 0,
  last_active_date date,
  full_name text,
  quick_access_preference text[], 
  exam_attempt_month smallint CHECK (exam_attempt_month IS NULL OR (exam_attempt_month >= 1 AND exam_attempt_month <= 12)),
  feedback jsonb,
  is_perminent_paid_user boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Faculty
CREATE TABLE public.faculty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject public.subject_category,
  rating numeric DEFAULT 0.00,
  students_count integer DEFAULT 0,
  level public.student_level,
  email text UNIQUE,
  phone text,
  location text,
  website text,
  profile_picture text,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tests
CREATE TABLE public.tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category public.subject_category NOT NULL,
  questions_count integer DEFAULT 0,
  duration integer,
  level public.test_level_type DEFAULT 'standard',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Questions
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES public.tests(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer public.mcq_option NOT NULL,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Practice Papers
CREATE TABLE public.practice_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject public.subject_category NOT NULL,
  exam_year text NOT NULL,
  level public.student_level NOT NULL,
  pages integer DEFAULT 0,
  type public.paper_type NOT NULL,
  pdf_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Study Planners
CREATE TABLE public.study_planners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  category public.subject_category NOT NULL,
  planner_date date NOT NULL,
  pages integer DEFAULT 0,
  downloads integer DEFAULT 0,
  rating numeric DEFAULT 0.00,
  pdf_url text NOT NULL,
  is_community boolean DEFAULT false,
  uploader_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Community Submissions
CREATE TABLE public.community_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  category public.subject_category NOT NULL,
  planner_date date NOT NULL,
  pdf_url text NOT NULL,
  status public.submission_status DEFAULT 'pending',
  admin_feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date text NOT NULL,
  summary text NOT NULL,
  url text NOT NULL,
  tag text NOT NULL,
  student_level public.student_level,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Test Attempts
CREATE TABLE public.test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  test_id uuid REFERENCES public.tests(id) ON DELETE SET NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  time_taken integer DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);

-- Test Attempt Answers
CREATE TABLE public.test_attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id) ON DELETE SET NULL,
  selected_option public.mcq_option,
  is_correct boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Calendar Events
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date integer NOT NULL,
  event_month integer NOT NULL,
  event_year integer NOT NULL,
  title text NOT NULL,
  event_time text NOT NULL,
  description text,
  subject public.subject_category,
  category public.event_category,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notes
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Study Sessions
CREATE TABLE public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  category public.subject_category NOT NULL,
  duration_seconds integer NOT NULL,
  session_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Todos
CREATE TABLE public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  subject public.subject_category NOT NULL,
  todo_date date NOT NULL,
  done boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Bookmarks
CREATE TABLE public.user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  planner_id uuid REFERENCES public.study_planners(id) ON DELETE CASCADE,
  practice_paper_id uuid REFERENCES public.practice_papers(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
  spom_material_id text,
  created_at timestamptz DEFAULT now()
);

-- Faculty Courses
CREATE TABLE public.faculty_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  name text NOT NULL,
  hours_count integer DEFAULT 0,
  price numeric NOT NULL,
  course_link text,
  views text DEFAULT '',
  batchtype text DEFAULT '',
  period text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Faculty Videos
CREATE TABLE public.faculty_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  duration_minutes integer,
  created_at timestamptz DEFAULT now()
);

-- Contact Submissions
CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Exam Dates
CREATE TABLE public.exam_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL UNIQUE CHECK (level = ANY (ARRAY['foundation'::text, 'intermediate'::text, 'final'::text])),
  exam_date date NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Exam Date (compatibility)
CREATE TABLE public.exam_date (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_name text NOT NULL,
  last_exam_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Site Content
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL UNIQUE,
  content jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_subscription_id text UNIQUE,
  razorpay_customer_id text,
  plan_id text,
  status text,
  plan_name text,
  expiry_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subject Meet Links
CREATE TABLE public.subject_meet_links (
  subject_id text PRIMARY KEY,
  meet_url text NOT NULL DEFAULT 'https://meet.google.com/new',
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

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

-- Flashcards
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

-- Flashcard Folder Sets (Junction)
CREATE TABLE public.flashcard_folder_sets (
  folder_id uuid REFERENCES public.flashcard_folders(id) ON DELETE CASCADE NOT NULL,
  set_id uuid REFERENCES public.flashcard_sets(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (folder_id, set_id)
);

-- Flashcard Requests
CREATE TABLE public.flashcard_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  topic text NOT NULL,
  notes text,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Leaderboard Config
CREATE TABLE public.leaderboard_config (
  key text PRIMARY KEY,
  weight numeric NOT NULL DEFAULT 0,
  label text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SPOM Content
CREATE TABLE public.spom_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap jsonb DEFAULT '[]'::jsonb,
  papers jsonb DEFAULT '[]'::jsonb,
  materials jsonb DEFAULT '[]'::jsonb,
  faqs jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Forum Groups
CREATE TABLE public.forum_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  profile_image_url text,
  banner_image_url text,
  created_at timestamptz DEFAULT now()
);

-- Forum Group Followers
CREATE TABLE public.forum_group_followers (
  user_id uuid NOT NULL,
  group_id uuid REFERENCES public.forum_groups(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);

-- Forum Posts
CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES public.forum_groups(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  category text NOT NULL DEFAULT 'Discussion',
  status text NOT NULL DEFAULT 'active',
  is_spom_observation boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Forum Replies
CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_reply_id uuid REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Forum Post Votes
CREATE TABLE public.forum_post_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- Forum Reports
CREATE TABLE public.forum_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feedback text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL,
  reference_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_viewed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 3. STORAGE BUCKET INITIALIZATION
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('forum-images', 'forum-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Auto-create profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Question counter logic
CREATE OR REPLACE FUNCTION public.update_test_question_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_active = TRUE THEN
    UPDATE tests SET questions_count = questions_count + 1 WHERE id = NEW.test_id;
  ELSIF TG_OP = 'DELETE' AND OLD.is_active = TRUE THEN
    UPDATE tests SET questions_count = questions_count - 1 WHERE id = OLD.test_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
        UPDATE tests SET questions_count = questions_count - 1 WHERE id = NEW.test_id;
    ELSIF OLD.is_active = FALSE AND NEW.is_active = TRUE THEN
        UPDATE tests SET questions_count = questions_count + 1 WHERE id = NEW.test_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Forum Reply Notifications
CREATE OR REPLACE FUNCTION public.handle_forum_reply_insert()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
  post_title text;
  reply_author_name text;
BEGIN
  SELECT user_id, title INTO post_owner_id, post_title
  FROM public.forum_posts
  WHERE id = NEW.post_id;

  SELECT COALESCE(full_name, 'Someone') INTO reply_author_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF post_owner_id IS NOT NULL AND post_owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, title, content, type, reference_id, metadata)
    VALUES (
      post_owner_id,
      'New reply on your post',
      NEW.content,
      'reply',
      NEW.id,
      jsonb_build_object(
        'post_id', NEW.post_id,
        'post_title', post_title,
        'author_name', reply_author_name
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Announcement Notifications
CREATE OR REPLACE FUNCTION public.handle_announcement_insert()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, content, type, reference_id, metadata)
  SELECT 
    id,
    'New Announcement',
    NEW.title,
    'announcement',
    NEW.id,
    jsonb_build_object(
      'summary', NEW.summary,
      'url', NEW.url,
      'tag', NEW.tag,
      'date', NEW.date
    )
  FROM public.profiles;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Triggers
CREATE OR REPLACE TRIGGER tr_update_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER tr_update_faculty BEFORE UPDATE ON public.faculty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER tr_update_tests BEFORE UPDATE ON public.tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER tr_update_questions BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER tr_update_practice_papers BEFORE UPDATE ON public.practice_papers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER tr_update_study_planners BEFORE UPDATE ON public.study_planners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER tr_update_community_submissions BEFORE UPDATE ON public.community_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER tr_update_notes BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER tr_update_todos BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER tr_update_subscriptions BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER tr_update_announcements BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER tr_update_flashcard_folders BEFORE UPDATE ON public.flashcard_folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER tr_update_flashcard_sets BEFORE UPDATE ON public.flashcard_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER tr_update_flashcards BEFORE UPDATE ON public.flashcards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_submissions_modtime BEFORE UPDATE ON public.community_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER tr_question_counter AFTER INSERT OR UPDATE OR DELETE ON public.questions FOR EACH ROW EXECUTE FUNCTION update_test_question_count();
CREATE OR REPLACE TRIGGER on_forum_reply_inserted AFTER INSERT ON public.forum_replies FOR EACH ROW EXECUTE FUNCTION public.handle_forum_reply_insert();
CREATE OR REPLACE TRIGGER on_announcement_inserted AFTER INSERT ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.handle_announcement_insert();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_planners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_meet_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_folder_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_group_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Read Access Policies (Authenticated)
CREATE POLICY "Auth Read Access" ON public.faculty FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Read Access" ON public.faculty_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Read Access" ON public.faculty_videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Read Access" ON public.tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Read Access" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Read Access" ON public.practice_papers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Read Access" ON public.study_planners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Read Access" ON public.calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Read Access" ON public.exam_dates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Read Access" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin All Access" ON public.announcements FOR ALL TO authenticated USING (true);

-- Manage Own Policies
CREATE POLICY "Manage Own Profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "Manage Own Notes" ON public.notes FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage Own Todos" ON public.todos FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage Own Sessions" ON public.study_sessions FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage Own Attempts" ON public.test_attempts FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage own bookmarks" ON public.user_bookmarks FOR ALL USING (auth.uid() = user_id);

-- Test Answers
CREATE POLICY "View Own Attempt Answers" ON public.test_attempt_answers FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.test_attempts WHERE id = attempt_id AND user_id = auth.uid()));

-- Community Submissions
CREATE POLICY "Users Create Own Sub" ON public.community_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users View Own Sub" ON public.community_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins View All" ON public.community_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins Update All" ON public.community_submissions FOR UPDATE TO authenticated USING (true);

-- Public & Contact
CREATE POLICY "Public Read Content" ON public.site_content FOR SELECT TO public USING (true);
CREATE POLICY "Admin All Content" ON public.site_content FOR ALL TO authenticated USING (true);
CREATE POLICY "Public Post Contact" ON public.contact_submissions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "View Subscriptions" ON public.subscriptions FOR SELECT TO public USING (auth.uid() = id);

-- Meet Links
CREATE POLICY "Read Meet Links" ON public.subject_meet_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage Meet Links" ON public.subject_meet_links FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.feedback->>'role' = 'admin')
);

-- Flashcards
CREATE POLICY "Users can manage their own folders" ON public.flashcard_folders FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage sets inside their own folders" ON public.flashcard_folder_sets FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.flashcard_folders WHERE id = folder_id AND user_id = auth.uid())
);
CREATE POLICY "Users can view admin sets or their own sets" ON public.flashcard_sets FOR SELECT TO authenticated USING (is_admin = true OR auth.uid() = user_id);
CREATE POLICY "Users can create their own sets or admins can create admin sets" ON public.flashcard_sets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR is_admin = true);
CREATE POLICY "Users can edit or delete their own sets or admins can manage admin sets" ON public.flashcard_sets FOR ALL TO authenticated USING (auth.uid() = user_id OR is_admin = true);
CREATE POLICY "Users can view cards in sets they have access to" ON public.flashcards FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.flashcard_sets WHERE id = set_id AND (is_admin = true OR user_id = auth.uid()))
);
CREATE POLICY "Users can manage cards in sets they own" ON public.flashcards FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.flashcard_sets WHERE id = set_id AND (user_id = auth.uid() OR is_admin = true))
);
CREATE POLICY "Authenticated users can create requests" ON public.flashcard_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users and admins can view requests" ON public.flashcard_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own requests" ON public.flashcard_requests FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Leaderboard
CREATE POLICY "Allow anyone to read leaderboard config" ON public.leaderboard_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow anyone to update leaderboard config (demo)" ON public.leaderboard_config FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow select profiles for authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Forum
CREATE POLICY "Groups viewable by authenticated" ON public.forum_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Group followers viewable by authenticated" ON public.forum_group_followers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can follow groups" ON public.forum_group_followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow groups" ON public.forum_group_followers FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Posts viewable by authenticated" ON public.forum_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create posts" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.forum_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.forum_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Replies viewable by authenticated" ON public.forum_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create replies" ON public.forum_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own replies" ON public.forum_replies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own replies" ON public.forum_replies FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Forum Demo Overrides (as per original forum_migration.sql)
CREATE POLICY "Anyone can view groups" ON public.forum_groups FOR SELECT USING (true);
CREATE POLICY "Anyone can create groups (demo)" ON public.forum_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update groups (demo)" ON public.forum_groups FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete groups (demo)" ON public.forum_groups FOR DELETE USING (true);
CREATE POLICY "Anyone can view group followers" ON public.forum_group_followers FOR SELECT USING (true);
CREATE POLICY "Anyone can follow groups (demo)" ON public.forum_group_followers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can unfollow groups (demo)" ON public.forum_group_followers FOR DELETE USING (true);
CREATE POLICY "Anyone can view posts" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can create posts (demo)" ON public.forum_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete posts (demo)" ON public.forum_posts FOR DELETE USING (true);
CREATE POLICY "Anyone can view replies" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "Anyone can create replies (demo)" ON public.forum_replies FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete replies (demo)" ON public.forum_replies FOR DELETE USING (true);
CREATE POLICY "Anyone can view votes" ON public.forum_post_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can cast votes (demo)" ON public.forum_post_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can change votes (demo)" ON public.forum_post_votes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can remove votes (demo)" ON public.forum_post_votes FOR DELETE USING (true);
CREATE POLICY "Anyone can create reports (demo)" ON public.forum_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view reports" ON public.forum_reports FOR SELECT USING (true); 
CREATE POLICY "Admin can update reports" ON public.forum_reports FOR UPDATE USING (true) WITH CHECK (true);

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage Objects Policies
CREATE POLICY "Anyone can upload forum images (demo)" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'forum-images');
CREATE POLICY "Anyone can view forum images" ON storage.objects FOR SELECT USING (bucket_id = 'forum-images');

-- ============================================================================
-- 6. INDEXES
-- ============================================================================
CREATE INDEX idx_faculty_courses_faculty_id ON public.faculty_courses(faculty_id);
CREATE INDEX idx_faculty_videos_faculty_id ON public.faculty_videos(faculty_id);
CREATE INDEX idx_questions_test_id ON public.questions(test_id);
CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_test_attempts_user_id ON public.test_attempts(user_id);
CREATE INDEX idx_user_bookmarks_user_id ON public.user_bookmarks(user_id);

CREATE UNIQUE INDEX idx_user_planner_bookmark ON public.user_bookmarks (user_id, planner_id) WHERE planner_id IS NOT NULL;
CREATE UNIQUE INDEX idx_user_paper_bookmark ON public.user_bookmarks (user_id, practice_paper_id) WHERE practice_paper_id IS NOT NULL;
CREATE UNIQUE INDEX idx_user_question_bookmark ON public.user_bookmarks (user_id, question_id) WHERE question_id IS NOT NULL;
CREATE UNIQUE INDEX idx_user_spom_material_bookmark ON public.user_bookmarks (user_id, spom_material_id) WHERE spom_material_id IS NOT NULL;

ALTER TABLE public.user_bookmarks ADD CONSTRAINT at_least_one_id CHECK (
    (planner_id IS NOT NULL AND practice_paper_id IS NULL AND question_id IS NULL AND spom_material_id IS NULL) OR
    (planner_id IS NULL AND practice_paper_id IS NOT NULL AND question_id IS NULL AND spom_material_id IS NULL) OR
    (planner_id IS NULL AND practice_paper_id IS NULL AND question_id IS NOT NULL AND spom_material_id IS NULL) OR
    (planner_id IS NULL AND practice_paper_id IS NULL AND question_id IS NULL AND spom_material_id IS NOT NULL)
);

CREATE INDEX idx_flashcard_folders_user_id ON public.flashcard_folders(user_id);
CREATE INDEX idx_flashcard_sets_user_id ON public.flashcard_sets(user_id);
CREATE INDEX idx_flashcards_set_id ON public.flashcards(set_id);
CREATE INDEX idx_flashcard_folder_sets_set_id ON public.flashcard_folder_sets(set_id);
CREATE INDEX idx_flashcard_requests_user_id ON public.flashcard_requests(user_id);
CREATE INDEX idx_flashcard_requests_status ON public.flashcard_requests(status);

CREATE INDEX idx_forum_post_votes_post ON public.forum_post_votes(post_id);
CREATE INDEX idx_forum_posts_group ON public.forum_posts(group_id);
CREATE INDEX idx_forum_posts_user ON public.forum_posts(user_id);
CREATE INDEX idx_forum_group_followers_user ON public.forum_group_followers(user_id);
CREATE INDEX idx_forum_group_followers_group ON public.forum_group_followers(group_id);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_viewed = false;

-- ============================================================================
-- 7. DYNAMIC VIEWS
-- ============================================================================

-- Dynamic user_leaderboard view
CREATE OR REPLACE VIEW public.user_leaderboard AS
WITH weights AS (
    SELECT 
        COALESCE(MAX(CASE WHEN key = 'streak_weight' THEN weight END), 0) as streak_w,
        COALESCE(MAX(CASE WHEN key = 'test_attempt_weight' THEN weight END), 0) as test_attempt_w,
        COALESCE(MAX(CASE WHEN key = 'test_score_weight' THEN weight END), 0) as test_score_w,
        COALESCE(MAX(CASE WHEN key = 'forum_post_weight' THEN weight END), 0) as forum_post_w,
        COALESCE(MAX(CASE WHEN key = 'forum_reply_weight' THEN weight END), 0) as forum_reply_w
    FROM public.leaderboard_config
),
user_stats AS (
    SELECT 
        p.id as user_id,
        p.full_name,
        COALESCE(p.current_streak, 0) as streak,
        (SELECT COUNT(*) FROM public.test_attempts ta WHERE ta.user_id = p.id) as test_attempts_count,
        (SELECT COALESCE(SUM(ta.score), 0) FROM public.test_attempts ta WHERE ta.user_id = p.id) as test_correct_answers,
        (SELECT COUNT(*) FROM public.forum_posts fp WHERE fp.user_id = p.id) as forum_posts_count,
        (SELECT COUNT(*) FROM public.forum_replies fr WHERE fr.user_id = p.id) as forum_replies_count
    FROM public.profiles p
),
calculated_xp AS (
    SELECT 
        us.user_id,
        us.full_name,
        us.streak,
        us.test_attempts_count,
        us.test_correct_answers,
        us.forum_posts_count,
        us.forum_replies_count,
        ROUND(
            (us.streak * w.streak_w) +
            (us.test_attempts_count * w.test_attempt_w) +
            (us.test_correct_answers * w.test_score_w) +
            (us.forum_posts_count * w.forum_post_w) +
            (us.forum_replies_count * w.forum_reply_w)
        )::integer as total_xp
    FROM user_stats us, weights w
)
SELECT 
    user_id,
    full_name,
    streak,
    test_attempts_count,
    test_correct_answers,
    forum_posts_count,
    forum_replies_count,
    total_xp,
    ROW_NUMBER() OVER (ORDER BY total_xp DESC, user_id ASC) as rank
FROM calculated_xp;

-- ============================================================================
-- 8. DEFAULT SEED DATA
-- ============================================================================

-- Seed Leaderboard Config
INSERT INTO public.leaderboard_config (key, weight, label, description) VALUES
('streak_weight', 10, 'Study Streak Multiplier', 'XP points awarded per day of active study streak.'),
('test_attempt_weight', 50, 'Mock Test Completed', 'XP points awarded for completing any mock exam.'),
('test_score_weight', 2, 'Mock Test Correct Answer', 'XP points awarded per correct answer in mock exams.'),
('forum_post_weight', 15, 'Forum Post Created', 'XP points awarded for starting a new discussion thread.'),
('forum_reply_weight', 5, 'Forum Reply Posted', 'XP points awarded for posting a reply in discussion threads.')
ON CONFLICT (key) DO UPDATE 
SET label = EXCLUDED.label, 
    description = EXCLUDED.description;

-- Seed Subject Meet Links
INSERT INTO public.subject_meet_links (subject_id, meet_url) VALUES
('principles_and_practice_of_accounting', 'https://meet.google.com/new'),
('business_laws', 'https://meet.google.com/new'),
('business_math_logical_reasoning_and_statistics', 'https://meet.google.com/new'),
('business_economics', 'https://meet.google.com/new'),
('advanced_accounting', 'https://meet.google.com/new'),
('corporate_and_other_laws', 'https://meet.google.com/new'),
('taxation', 'https://meet.google.com/new'),
('cost_and_management_accounting', 'https://meet.google.com/new'),
('auditing_and_ethics', 'https://meet.google.com/new'),
('financial_management_and_strategic_management', 'https://meet.google.com/new'),
('financial_reporting', 'https://meet.google.com/new'),
('advanced_financial_management', 'https://meet.google.com/new'),
('advanced_auditing_assurance_and_professional_ethics', 'https://meet.google.com/new'),
('direct_tax_laws', 'https://meet.google.com/new'),
('indirect_tax_laws', 'https://meet.google.com/new'),
('integrated_business_solutions', 'https://meet.google.com/new')
ON CONFLICT (subject_id) DO NOTHING;

-- Seed SPOM Content
INSERT INTO public.spom_content (roadmap, papers, materials, faqs)
SELECT 
  '[
    {"step": "01", "title": "Eligibility Check", "body": "Open only to students who have cleared CA Intermediate (both groups) and registered for CA Final."},
    {"step": "02", "title": "Self-Paced Online Registration", "body": "Register through the ICAI SSP Portal (eservices.icai.org). Choose any combination of Set A–D. No fixed cohort dates."},
    {"step": "03", "title": "Access Study Material", "body": "Once enrolled, modules unlock in your ICAI dashboard. Download PDFs, access recorded lectures and self-assessment tests."},
    {"step": "04", "title": "Online Assessment", "body": "Each set has an online proctored MCQ-based exam. You can attempt whenever you feel prepared — multiple windows available each year."},
    {"step": "05", "title": "Qualify Before Final Exam", "body": "All four SPOM sets must be cleared before you appear for the CA Final group exams."}
  ]'::jsonb,
  '[
    {"code": "Set A", "title": "Set A — Integrated Business Solutions", "summary": "A multi-disciplinary, case-study-based paper that integrates concepts across Financial Reporting, Audit, Tax and Strategic Management. Tests your ability to apply core CA knowledge to real business problems.", "color": "from-accent/20 to-accent/5"},
    {"code": "Set B", "title": "Set B — Strategic Cost & Performance Management", "summary": "Focused on advanced costing, performance evaluation, and strategic decision-making. Builds on Inter-level cost concepts with deeper analytical frameworks.", "color": "from-emerald-500/20 to-emerald-500/5"},
    {"code": "Set C", "title": "Set C — Risk Management & Governance", "summary": "Covers enterprise risk frameworks, corporate governance, internal controls, and the role of the CA in safeguarding stakeholder value.", "color": "from-amber-500/20 to-amber-500/5"},
    {"code": "Set D", "title": "Set D — Sustainable Finance & ESG Reporting", "summary": "Newest addition reflecting global trends — green finance, ESG metrics, BRSR reporting, and sustainability assurance for Indian companies.", "color": "from-violet-500/20 to-violet-500/5"}
  ]'::jsonb,
  '[
    {"id": "spom-a-1", "title": "Set A — Module 1: Integrated Case Studies", "paper": "Set A", "type": "Module", "pages": 412, "url": "https://resource.cdn.icai.org/"},
    {"id": "spom-a-2", "title": "Set A — Practice Manual", "paper": "Set A", "type": "Practice Manual", "pages": 268, "url": "https://resource.cdn.icai.org/"},
    {"id": "spom-b-1", "title": "Set B — Strategic Cost Management Module", "paper": "Set B", "type": "Module", "pages": 356, "url": "https://resource.cdn.icai.org/"},
    {"id": "spom-b-2", "title": "Set B — Question Bank", "paper": "Set B", "type": "Question Bank", "pages": 184, "url": "https://resource.cdn.icai.org/"},
    {"id": "spom-c-1", "title": "Set C — Risk Management Framework Module", "paper": "Set C", "type": "Module", "pages": 298, "url": "https://resource.cdn.icai.org/"},
    {"id": "spom-c-2", "title": "Set C — Governance Case Studies", "paper": "Set C", "type": "Notes", "pages": 142, "url": "https://resource.cdn.icai.org/"},
    {"id": "spom-d-1", "title": "Set D — ESG Reporting & BRSR Module", "paper": "Set D", "type": "Module", "pages": 324, "url": "https://resource.cdn.icai.org/"},
    {"id": "spom-d-2", "title": "Set D — Sustainable Finance Practice Manual", "paper": "Set D", "type": "Practice Manual", "pages": 196, "url": "https://resource.cdn.icai.org/"}
  ]'::jsonb,
  '[
    {"q": "What does SPOM stand for?", "a": "SPOM is the Self-Paced Online Module — a new ICAI initiative for CA Final students that lets you learn and qualify selected papers online, at your own pace, before the main Final exams."},
    {"q": "Is SPOM mandatory for CA Final students?", "a": "Yes. Under the new scheme, qualifying all four SPOM sets (A, B, C, D) is a prerequisite to appearing for the CA Final examinations."},
    {"q": "Can I attempt all four sets together?", "a": "Yes, you can attempt them in any order and any combination — together or one at a time. There is no fixed sequence."},
    {"q": "How are SPOM papers assessed?", "a": "Each set is assessed via an online proctored MCQ test of 100 marks. The passing benchmark is 50%. Negative marking is currently not applied."},
    {"q": "How many attempts do I get?", "a": "Unlimited attempts. If you don't clear a set, you can re-register and re-attempt in the next available window — usually multiple windows are released each year."},
    {"q": "Is there a fee for SPOM?", "a": "Yes, ICAI charges a nominal registration fee per set. Refer to the latest ICAI announcement for exact figures, as fees are revised periodically."},
    {"q": "Will SPOM marks reflect on my CA Final marksheet?", "a": "SPOM results are issued separately as a qualifying certificate. They do not get added to your CA Final aggregate but are mandatory to clear."},
    {"q": "Where can I get the official syllabus?", "a": "Visit icai.org → Students → Self-Paced Online Modules. The detailed syllabus and study material for each set are published there."}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM spom_content);

-- Seed Sample Admin Flashcard Sets and Cards
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

-- ============================================================================
-- 9. STUDY ROOMS SCHEMA
-- ============================================================================

CREATE TABLE public.study_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text,
  meet_link text,
  description text,
  is_creator_room boolean NOT NULL DEFAULT false,
  session_status text NOT NULL DEFAULT 'idle' CHECK (session_status IN ('idle', 'live', 'ended')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON public.study_rooms 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin manage" ON public.study_rooms 
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.feedback->>'role' = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.feedback->>'role' = 'admin'
    )
  );

CREATE TRIGGER tr_update_study_rooms 
  BEFORE UPDATE ON public.study_rooms 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


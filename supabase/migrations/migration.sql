-- 1. CREATE CUSTOM ENUM TYPES
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

-- 2. CREATE TABLES
-- Profiles (Linked to Supabase Auth)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_type public.student_level,
  current_streak integer DEFAULT 0,
  last_active_date date,
  full_name text,
  quick_access_preference text[], 
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
  faculty_id uuid REFERENCES public.faculty(id),
  category public.subject_category NOT NULL,
  planner_date date NOT NULL,
  pages integer DEFAULT 0,
  downloads integer DEFAULT 0,
  rating numeric DEFAULT 0.00,
  pdf_url text NOT NULL,
  is_community boolean DEFAULT false,
  uploader_id uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Community Submissions
CREATE TABLE public.community_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  title text NOT NULL,
  faculty_id uuid REFERENCES public.faculty(id),
  category public.subject_category NOT NULL,
  planner_date date NOT NULL,
  pdf_url text NOT NULL,
  pages integer DEFAULT 0,
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
  user_id uuid REFERENCES public.profiles(id),
  test_id uuid REFERENCES public.tests(id),
  score integer NOT NULL,
  total_questions integer NOT NULL,
  time_taken integer DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);

-- Test Attempt Answers
CREATE TABLE public.test_attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id),
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
  user_id uuid REFERENCES public.profiles(id),
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
  planner_id uuid REFERENCES public.study_planners(id),
  practice_paper_id uuid REFERENCES public.practice_papers(id),
  question_id uuid REFERENCES public.questions(id),
  created_at timestamptz DEFAULT now()
);

-- Faculty Courses
CREATE TABLE public.faculty_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid REFERENCES public.faculty(id),
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
  faculty_id uuid REFERENCES public.faculty(id),
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
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Exam Dates
CREATE TABLE public.exam_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL UNIQUE CHECK (level = ANY (ARRAY['foundation'::text, 'intermediate'::text, 'final'::text])),
  exam_date date NOT NULL,
  updated_at timestamptz DEFAULT now()
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
  id uuid PRIMARY KEY REFERENCES auth.users(id),
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

-- 3. FUNCTIONS & TRIGGERS
-- Auto-create profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Question counter logic
CREATE OR REPLACE FUNCTION public.update_test_question_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Apply Triggers for updated_at
CREATE TRIGGER tr_update_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_faculty BEFORE UPDATE ON public.faculty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_tests BEFORE UPDATE ON public.tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_questions BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_practice_papers BEFORE UPDATE ON public.practice_papers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_study_planners BEFORE UPDATE ON public.study_planners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_community_submissions BEFORE UPDATE ON public.community_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_notes BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_todos BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_subscriptions BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_announcements BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply Trigger for question count
CREATE TRIGGER tr_question_counter AFTER INSERT OR UPDATE OR DELETE ON public.questions FOR EACH ROW EXECUTE FUNCTION update_test_question_count();

-- 4. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_planners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_meet_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES
-- Read-only for authenticated
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


-- User-owned data (Manage Own)
CREATE POLICY "Manage Own Profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "Manage Own Notes" ON public.notes FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage Own Todos" ON public.todos FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage Own Sessions" ON public.study_sessions FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage Own Attempts" ON public.test_attempts FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage Own Bookmarks" ON public.user_bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Test Answers (Secure check)
CREATE POLICY "View Own Attempt Answers" ON public.test_attempt_answers FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.test_attempts WHERE id = attempt_id AND user_id = auth.uid()));

-- Community Submissions
CREATE POLICY "Users Create Own Sub" ON public.community_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users View Own Sub" ON public.community_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins View All" ON public.community_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins Update All" ON public.community_submissions FOR UPDATE TO authenticated USING (true);

-- Public & Site Content
CREATE POLICY "Public Read Content" ON public.site_content FOR SELECT TO public USING (true);
CREATE POLICY "Admin All Content" ON public.site_content FOR ALL TO authenticated USING (true);
CREATE POLICY "Public Post Contact" ON public.contact_submissions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "View Subscriptions" ON public.subscriptions FOR SELECT TO public USING (auth.uid() = id);

-- Meet Links
CREATE POLICY "Read Meet Links" ON public.subject_meet_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage Meet Links" ON public.subject_meet_links FOR ALL TO authenticated USING (true);

-- 6. INDEXES
CREATE INDEX idx_faculty_courses_faculty_id ON public.faculty_courses(faculty_id);
CREATE INDEX idx_faculty_videos_faculty_id ON public.faculty_videos(faculty_id);
CREATE INDEX idx_questions_test_id ON public.questions(test_id);
CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_test_attempts_user_id ON public.test_attempts(user_id);
CREATE INDEX idx_user_bookmarks_user_id ON public.user_bookmarks(user_id);
CREATE UNIQUE INDEX idx_unique_planner_bookmark ON public.user_bookmarks (user_id, planner_id) WHERE planner_id IS NOT NULL;
CREATE UNIQUE INDEX idx_unique_practice_paper_bookmark ON public.user_bookmarks (user_id, practice_paper_id) WHERE practice_paper_id IS NOT NULL;
CREATE UNIQUE INDEX idx_unique_question_bookmark ON public.user_bookmarks (user_id, question_id) WHERE question_id IS NOT NULL;
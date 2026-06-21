-- ============================================================================
-- LEADERBOARD MIGRATION
-- ============================================================================

-- Create leaderboard_config table
CREATE TABLE IF NOT EXISTS public.leaderboard_config (
    key TEXT PRIMARY KEY,
    weight NUMERIC NOT NULL DEFAULT 0,
    label TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.leaderboard_config ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies for idempotency
DROP POLICY IF EXISTS "Allow anyone to read leaderboard config" ON public.leaderboard_config;
DROP POLICY IF EXISTS "Allow anyone to update leaderboard config (demo)" ON public.leaderboard_config;
DROP POLICY IF EXISTS "Allow select profiles for authenticated" ON public.profiles;

-- Create policies for leaderboard_config
CREATE POLICY "Allow anyone to read leaderboard config"
    ON public.leaderboard_config FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow anyone to update leaderboard config (demo)"
    ON public.leaderboard_config FOR ALL
    TO authenticated
    USING (true);

-- Create public read policy on profiles to allow users to see leaderboard standings
CREATE POLICY "Allow select profiles for authenticated"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Seed initial weight configuration
INSERT INTO public.leaderboard_config (key, weight, label, description) VALUES
('streak_weight', 10, 'Study Streak Multiplier', 'XP points awarded per day of active study streak.'),
('test_attempt_weight', 50, 'Mock Test Completed', 'XP points awarded for completing any mock exam.'),
('test_score_weight', 2, 'Mock Test Correct Answer', 'XP points awarded per correct answer in mock exams.'),
('forum_post_weight', 15, 'Forum Post Created', 'XP points awarded for starting a new discussion thread.'),
('forum_reply_weight', 5, 'Forum Reply Posted', 'XP points awarded for posting a reply in discussion threads.')
ON CONFLICT (key) DO UPDATE 
SET label = EXCLUDED.label, 
    description = EXCLUDED.description;

-- Create dynamic user_leaderboard view to compute real-time XP and rank
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

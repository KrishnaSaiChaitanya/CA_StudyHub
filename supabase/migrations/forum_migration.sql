-- ============================================================================
-- 1. UTILITY FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;


-- ============================================================================
-- 2. STORAGE BUCKET INITIALIZATION
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('forum-images', 'forum-images', true);


-- ============================================================================
-- 3. TABLE DEFINITIONS (Ordered by Foreign Key Dependencies)
-- ============================================================================

-- Forum Groups
CREATE TABLE public.forum_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  profile_image_url TEXT,
  banner_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Forum Group Followers
CREATE TABLE public.forum_group_followers (
  user_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES public.forum_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);

-- Forum Posts
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.forum_groups(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'Discussion',
  status TEXT NOT NULL DEFAULT 'active', -- 'active' or 'blocked'
  is_spom_observation BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Forum Replies
CREATE TABLE public.forum_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Forum Post Votes
CREATE TABLE public.forum_post_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL, 
  user_id UUID NOT NULL, 
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- Forum Reports
CREATE TABLE public.forum_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'dismissed', 'blocked'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ============================================================================
-- 4. INDEXES & TRIGGERS
-- ============================================================================

CREATE INDEX idx_forum_post_votes_post ON public.forum_post_votes(post_id);
CREATE INDEX idx_forum_posts_group ON public.forum_posts(group_id);
CREATE INDEX idx_forum_posts_user ON public.forum_posts(user_id);
CREATE INDEX idx_forum_group_followers_user ON public.forum_group_followers(user_id);
CREATE INDEX idx_forum_group_followers_group ON public.forum_group_followers(group_id);

CREATE TRIGGER update_forum_posts_updated_at 
  BEFORE UPDATE ON public.forum_posts 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Note: This requires the 'profiles' table to already exist in your database
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 5. ROW LEVEL SECURITY - BASE PRODUCTION SETUP
-- ============================================================================

ALTER TABLE public.forum_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_group_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reports ENABLE ROW LEVEL SECURITY;

-- Groups Base Policies
CREATE POLICY "Groups viewable by authenticated" ON public.forum_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Group followers viewable by authenticated" ON public.forum_group_followers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can follow groups" ON public.forum_group_followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow groups" ON public.forum_group_followers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Posts Base Policies
CREATE POLICY "Posts viewable by authenticated" ON public.forum_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create posts" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.forum_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.forum_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Replies Base Policies
CREATE POLICY "Replies viewable by authenticated" ON public.forum_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create replies" ON public.forum_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own replies" ON public.forum_replies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own replies" ON public.forum_replies FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage Base Policies
CREATE POLICY "Authenticated users can upload forum images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'forum-images');
CREATE POLICY "Anyone can view forum images" ON storage.objects FOR SELECT USING (bucket_id = 'forum-images');
CREATE POLICY "Users can delete own forum images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'forum-images' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ============================================================================
-- 6. ROW LEVEL SECURITY - TEMPORARY DEMO OVERRIDES
-- ============================================================================

-- Forum Groups Demo Overrides
CREATE POLICY "Anyone can view groups" ON public.forum_groups FOR SELECT USING (true);
CREATE POLICY "Anyone can create groups (demo)" ON public.forum_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update groups (demo)" ON public.forum_groups FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete groups (demo)" ON public.forum_groups FOR DELETE USING (true);

-- Forum Group Followers Demo Overrides
CREATE POLICY "Anyone can view group followers" ON public.forum_group_followers FOR SELECT USING (true);
CREATE POLICY "Anyone can follow groups (demo)" ON public.forum_group_followers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can unfollow groups (demo)" ON public.forum_group_followers FOR DELETE USING (true);

-- Forum Posts Demo Overrides
DROP POLICY IF EXISTS "Users can create posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Posts viewable by authenticated" ON public.forum_posts;

CREATE POLICY "Anyone can view posts" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can create posts (demo)" ON public.forum_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete posts (demo)" ON public.forum_posts FOR DELETE USING (true);

-- Forum Replies Demo Overrides
DROP POLICY IF EXISTS "Users can create replies" ON public.forum_replies;
DROP POLICY IF EXISTS "Users can delete own replies" ON public.forum_replies;
DROP POLICY IF EXISTS "Replies viewable by authenticated" ON public.forum_replies;

CREATE POLICY "Anyone can view replies" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "Anyone can create replies (demo)" ON public.forum_replies FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete replies (demo)" ON public.forum_replies FOR DELETE USING (true);

-- Forum Post Votes Demo Policies
CREATE POLICY "Anyone can view votes" ON public.forum_post_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can cast votes (demo)" ON public.forum_post_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can change votes (demo)" ON public.forum_post_votes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can remove votes (demo)" ON public.forum_post_votes FOR DELETE USING (true);

-- Forum Reports Demo Policies
CREATE POLICY "Anyone can create reports (demo)" ON public.forum_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view reports" ON public.forum_reports FOR SELECT USING (true); 
CREATE POLICY "Admin can update reports" ON public.forum_reports FOR UPDATE USING (true) WITH CHECK (true);

-- Storage Demo Overrides
DROP POLICY IF EXISTS "Anyone can upload forum images (demo)" ON storage.objects;
CREATE POLICY "Anyone can upload forum images (demo)" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'forum-images');

DROP POLICY IF EXISTS "Anyone can view forum images" ON storage.objects;
CREATE POLICY "Anyone can view forum images" ON storage.objects FOR SELECT USING (bucket_id = 'forum-images');
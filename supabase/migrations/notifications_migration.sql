-- ============================================================================
-- NOTIFICATIONS TABLE & SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL, -- 'reply', 'announcement', etc.
  reference_id UUID,  -- reference to specific reply/announcement/etc.
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_viewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE is_viewed = false;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" 
  ON public.notifications 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" 
  ON public.notifications 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" 
  ON public.notifications 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Trigger for Forum Reply
CREATE OR REPLACE FUNCTION public.handle_forum_reply_insert()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  post_title TEXT;
  reply_author_name TEXT;
BEGIN
  -- Get the post owner and post title
  SELECT user_id, title INTO post_owner_id, post_title
  FROM public.forum_posts
  WHERE id = NEW.post_id;

  -- Get reply author's name
  SELECT COALESCE(full_name, 'Someone') INTO reply_author_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Only notify if the replier is NOT the post owner
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

DROP TRIGGER IF EXISTS on_forum_reply_inserted ON public.forum_replies;
CREATE TRIGGER on_forum_reply_inserted
  AFTER INSERT ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.handle_forum_reply_insert();

-- Trigger for Announcement
CREATE OR REPLACE FUNCTION public.handle_announcement_insert()
RETURNS TRIGGER AS $$
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

DROP TRIGGER IF EXISTS on_announcement_inserted ON public.announcements;
CREATE TRIGGER on_announcement_inserted
  AFTER INSERT ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.handle_announcement_insert();

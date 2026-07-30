-- Trigger function to keep posts.likes_count in sync with reactions table
CREATE OR REPLACE FUNCTION public.sync_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS reactions_likes_count_sync ON public.reactions;
DROP TRIGGER IF EXISTS reactions_likes_count_sync_insert ON public.reactions;
DROP TRIGGER IF EXISTS reactions_likes_count_sync_delete ON public.reactions;

CREATE TRIGGER reactions_likes_count_sync_insert
AFTER INSERT ON public.reactions
FOR EACH ROW
WHEN (NEW.type = 'like')
EXECUTE FUNCTION public.sync_post_likes_count();

CREATE TRIGGER reactions_likes_count_sync_delete
AFTER DELETE ON public.reactions
FOR EACH ROW
WHEN (OLD.type = 'like')
EXECUTE FUNCTION public.sync_post_likes_count();

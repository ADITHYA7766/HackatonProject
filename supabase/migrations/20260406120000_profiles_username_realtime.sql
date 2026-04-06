-- Username on profiles (separate from display name and company name)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique ON public.profiles (lower(username))
  WHERE username IS NOT NULL AND length(trim(username)) > 0;

-- Realtime needs old row for UPDATE filters; optional but helps postgres_changes payloads
ALTER TABLE public.listing_requests REPLICA IDENTITY FULL;

-- Enable Realtime for buy-request notifications (no-op if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'listing_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.listing_requests;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, company_name, username)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'display_name', '')), ''),
      split_part(NEW.email, '@', 1)
    ),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'company_name', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'username', '')), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

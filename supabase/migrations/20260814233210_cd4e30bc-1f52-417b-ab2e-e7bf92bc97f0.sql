-- 1. Let existing accounts sign in (email confirmation was blocking every login)
UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE email_confirmed_at IS NULL;

-- 2. SECURITY: only the author may edit/delete their own message
DROP POLICY IF EXISTS "msg_update" ON public.messages;
CREATE POLICY "msg_update_own" ON public.messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());

-- 3. SECURITY: hide phone numbers from other users (column-level grants)
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, username, display_name, avatar_url, about, mood, is_online, last_seen, created_at, updated_at)
  ON public.profiles TO authenticated;
GRANT UPDATE (username, display_name, avatar_url, about, phone, mood, is_online, last_seen) ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.my_profile()
RETURNS public.profiles LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.my_profile() FROM anon;
GRANT EXECUTE ON FUNCTION public.my_profile() TO authenticated;

-- 4. REPORTS
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());
CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND reported_id <> auth.uid());
CREATE TRIGGER reports_touch BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. CALL SIGNALLING (WebRTC-ready)
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS ended_at timestamptz;

CREATE TABLE public.call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX call_signals_call_idx ON public.call_signals (call_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.call_signals TO authenticated;
GRANT ALL ON public.call_signals TO service_role;
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_call_party(_call_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.calls c WHERE c.id = _call_id AND (c.caller_id = _user_id OR c.callee_id = _user_id));
$$;
REVOKE EXECUTE ON FUNCTION public.is_call_party(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_call_party(uuid, uuid) TO authenticated;

CREATE POLICY "signals_select_party" ON public.call_signals FOR SELECT TO authenticated USING (public.is_call_party(call_id, auth.uid()));
CREATE POLICY "signals_insert_party" ON public.call_signals FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_call_party(call_id, auth.uid()));
CREATE POLICY "signals_delete_party" ON public.call_signals FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- 6. EFFICIENT CHAT LIST
CREATE OR REPLACE FUNCTION public.conversation_overview()
RETURNS TABLE (
  id uuid, is_group boolean, name text, avatar_url text, last_message_at timestamptz,
  muted boolean, last_read_at timestamptz, unread integer, other_id uuid,
  last_message_id uuid, last_sender_id uuid, last_type text, last_body text,
  last_media_url text, last_deleted_at timestamptz, last_created_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (SELECT auth.uid() AS uid),
  mine AS (
    SELECT cm.conversation_id, cm.muted, cm.last_read_at, c.is_group, c.name, c.avatar_url, c.last_message_at
    FROM public.conversation_members cm
    JOIN public.conversations c ON c.id = cm.conversation_id
    WHERE cm.user_id = (SELECT uid FROM me)
  )
  SELECT mi.conversation_id, mi.is_group, mi.name, mi.avatar_url, mi.last_message_at,
    mi.muted, mi.last_read_at,
    COALESCE((SELECT count(*) FROM public.messages m
      WHERE m.conversation_id = mi.conversation_id
        AND m.sender_id <> (SELECT uid FROM me)
        AND m.created_at > mi.last_read_at), 0)::int,
    (SELECT cm2.user_id FROM public.conversation_members cm2
      WHERE cm2.conversation_id = mi.conversation_id AND cm2.user_id <> (SELECT uid FROM me) LIMIT 1),
    lm.id, lm.sender_id, lm.type, lm.body, lm.media_url, lm.deleted_at, lm.created_at
  FROM mine mi
  LEFT JOIN LATERAL (
    SELECT m.id, m.sender_id, m.type, m.body, m.media_url, m.deleted_at, m.created_at
    FROM public.messages m WHERE m.conversation_id = mi.conversation_id
    ORDER BY m.created_at DESC LIMIT 1
  ) lm ON true
  ORDER BY mi.last_message_at DESC;
$$;
REVOKE EXECUTE ON FUNCTION public.conversation_overview() FROM anon;
GRANT EXECUTE ON FUNCTION public.conversation_overview() TO authenticated;

-- 7. INDEXES
CREATE INDEX IF NOT EXISTS contacts_user_idx ON public.contacts (user_id);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stories_expires_idx ON public.stories (expires_at, created_at);
CREATE INDEX IF NOT EXISTS reports_reporter_idx ON public.reports (reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cm_user_idx ON public.conversation_members (user_id);

-- 8. REALTIME
ALTER TABLE public.calls REPLICA IDENTITY FULL;
ALTER TABLE public.call_signals REPLICA IDENTITY FULL;
ALTER TABLE public.stories REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
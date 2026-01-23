-- =====================================================
-- TABLE: chat_rooms (salles de chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'group',
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public rooms are viewable"
ON public.chat_rooms FOR SELECT USING (is_private = false);

CREATE POLICY "Members can create rooms"
ON public.chat_rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- TABLE: chat_room_members (membres des salles)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (room_id, user_id)
);

ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view room members"
ON public.chat_room_members FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can join rooms"
ON public.chat_room_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
ON public.chat_room_members FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: chat_messages (messages de chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  attachment_url TEXT,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  reply_to_id UUID REFERENCES public.chat_messages(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can view messages"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = chat_messages.room_id
    AND chat_rooms.is_private = false
  )
  OR EXISTS (
    SELECT 1 FROM public.chat_room_members
    WHERE chat_room_members.room_id = chat_messages.room_id
    AND chat_room_members.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can edit their own messages"
ON public.chat_messages FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
ON public.chat_messages FOR DELETE
USING (auth.uid() = sender_id);

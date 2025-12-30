-- =====================================================
-- SCHÉMA COMPLET : PLATEFORME MÉDIA PAROISSIALE SAAS
-- =====================================================

-- 1. Enum pour les rôles utilisateurs
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'member', 'guest');

-- 2. Enum pour le statut des contenus
CREATE TYPE public.content_status AS ENUM ('draft', 'pending', 'published', 'archived');

-- 3. Enum pour le type de média
CREATE TYPE public.media_type AS ENUM ('video', 'image', 'audio', 'document');

-- 4. Enum pour le statut des commentaires
CREATE TYPE public.comment_status AS ENUM ('pending', 'approved', 'rejected', 'spam');

-- 5. Enum pour le statut des donations
CREATE TYPE public.donation_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- =====================================================
-- TABLE: profiles (profils utilisateurs étendus)
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  date_of_birth DATE,
  is_active BOOLEAN DEFAULT true,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- TABLE: user_roles (rôles des utilisateurs)
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Fonction pour vérifier les rôles (Security Definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Fonction pour obtenir tous les rôles d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(role), ARRAY[]::app_role[])
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TABLE: categories (catégories de contenu)
-- =====================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#6B7280',
  parent_id UUID REFERENCES public.categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
ON public.categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TABLE: videos (vidéos avec support HLS)
-- =====================================================
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  hls_url TEXT,
  duration INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  category_id UUID REFERENCES public.categories(id),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status content_status DEFAULT 'draft',
  is_live BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  allow_comments BOOLEAN DEFAULT true,
  allow_download BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published videos are viewable by everyone"
ON public.videos FOR SELECT
USING (status = 'published' OR author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors can insert videos"
ON public.videos FOR INSERT
WITH CHECK (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors can update their videos"
ON public.videos FOR UPDATE
USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete videos"
ON public.videos FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TABLE: media (images, documents, audio)
-- =====================================================
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_type media_type NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  album_id UUID,
  category_id UUID REFERENCES public.categories(id),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status content_status DEFAULT 'published',
  is_public BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public media viewable by everyone"
ON public.media FOR SELECT
USING (is_public = true OR author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can upload media"
ON public.media FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update their media"
ON public.media FOR UPDATE
USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete media"
ON public.media FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TABLE: albums (albums photos/médias)
-- =====================================================
CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  media_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public albums viewable by everyone"
ON public.albums FOR SELECT USING (is_public = true OR author_id = auth.uid());

CREATE POLICY "Authenticated users can create albums"
ON public.albums FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can manage their albums"
ON public.albums FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete albums"
ON public.albums FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TABLE: comments (commentaires threaded)
-- =====================================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  status comment_status DEFAULT 'pending',
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT valid_target CHECK (
    (video_id IS NOT NULL AND media_id IS NULL) OR
    (video_id IS NULL AND media_id IS NOT NULL)
  )
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved comments are viewable"
ON public.comments FOR SELECT
USING (status = 'approved' OR author_id = auth.uid() OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can post comments"
ON public.comments FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their comments"
ON public.comments FOR UPDATE
USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors and admins can delete comments"
ON public.comments FOR DELETE
USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TABLE: likes (likes sur vidéos/médias/commentaires)
-- =====================================================
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT valid_like_target CHECK (
    (video_id IS NOT NULL)::int + (media_id IS NOT NULL)::int + (comment_id IS NOT NULL)::int = 1
  ),
  UNIQUE (user_id, video_id),
  UNIQUE (user_id, media_id),
  UNIQUE (user_id, comment_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
ON public.likes FOR SELECT USING (true);

CREATE POLICY "Users can manage their likes"
ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their likes"
ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: bookmarks (signets/favoris)
-- =====================================================
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, video_id),
  UNIQUE (user_id, media_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their bookmarks"
ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their bookmarks"
ON public.bookmarks FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: events (événements paroissiaux)
-- =====================================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  image_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  category_id UUID REFERENCES public.categories(id),
  organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  registration_required BOOLEAN DEFAULT false,
  registration_deadline TIMESTAMPTZ,
  status content_status DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published events are viewable by everyone"
ON public.events FOR SELECT USING (status = 'published' OR organizer_id = auth.uid());

CREATE POLICY "Authenticated users can create events"
ON public.events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organizers can update their events"
ON public.events FOR UPDATE USING (auth.uid() = organizer_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TABLE: event_registrations (inscriptions événements)
-- =====================================================
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'registered',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their registrations"
ON public.event_registrations FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can register"
ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their registration"
ON public.event_registrations FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: donations (dons et quêtes)
-- =====================================================
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_name TEXT,
  donor_email TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  campaign_id UUID,
  payment_method TEXT,
  payment_intent_id TEXT,
  status donation_status DEFAULT 'pending',
  is_anonymous BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_interval TEXT,
  message TEXT,
  receipt_sent BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their donations"
ON public.donations FOR SELECT
USING (auth.uid() = donor_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can make a donation"
ON public.donations FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update donations"
ON public.donations FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TABLE: donation_campaigns (campagnes de dons)
-- =====================================================
CREATE TABLE public.donation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  goal_amount DECIMAL(10,2),
  current_amount DECIMAL(10,2) DEFAULT 0,
  donor_count INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.donation_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active campaigns are viewable"
ON public.donation_campaigns FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage campaigns"
ON public.donation_campaigns FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TABLE: chat_rooms (salles de chat)
-- =====================================================
CREATE TABLE public.chat_rooms (
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
ON public.chat_rooms FOR SELECT USING (is_private = false OR public.has_role(auth.uid(), 'member'));

CREATE POLICY "Members can create rooms"
ON public.chat_rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- TABLE: chat_room_members (membres des salles)
-- =====================================================
CREATE TABLE public.chat_room_members (
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
CREATE TABLE public.chat_messages (
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
USING (EXISTS (
  SELECT 1 FROM public.chat_room_members 
  WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id AND EXISTS (
  SELECT 1 FROM public.chat_room_members 
  WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
));

CREATE POLICY "Authors can edit messages"
ON public.chat_messages FOR UPDATE USING (auth.uid() = sender_id);

-- =====================================================
-- TABLE: announcements (annonces)
-- =====================================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  priority TEXT DEFAULT 'normal',
  is_pinned BOOLEAN DEFAULT false,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status content_status DEFAULT 'published',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published announcements are viewable"
ON public.announcements FOR SELECT USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY "Admins can manage announcements"
ON public.announcements FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- =====================================================
-- TABLE: notifications (notifications)
-- =====================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications"
ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: prayer_intentions (intentions de prière)
-- =====================================================
CREATE TABLE public.prayer_intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  prayer_count INTEGER DEFAULT 0,
  status content_status DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.prayer_intentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public intentions are viewable"
ON public.prayer_intentions FOR SELECT
USING (is_public = true OR author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can post intentions"
ON public.prayer_intentions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update their intentions"
ON public.prayer_intentions FOR UPDATE USING (auth.uid() = author_id);

-- =====================================================
-- TABLE: analytics (statistiques de visionnage)
-- =====================================================
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  watch_time INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2),
  device_type TEXT,
  country TEXT,
  city TEXT,
  referrer TEXT,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view analytics"
ON public.analytics FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert analytics"
ON public.analytics FOR INSERT WITH CHECK (true);

-- =====================================================
-- TABLE: homepage_content (contenu personnalisable)
-- =====================================================
CREATE TABLE public.homepage_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  title TEXT,
  subtitle TEXT,
  content JSONB DEFAULT '{}',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homepage content is viewable"
ON public.homepage_content FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage homepage"
ON public.homepage_content FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TRIGGERS: Mise à jour automatique updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON public.media
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON public.albums
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donation_campaigns_updated_at BEFORE UPDATE ON public.donation_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TRIGGER: Création automatique du profil
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  
  -- Attribuer le rôle 'member' par défaut
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INDEXES pour performance
-- =====================================================
CREATE INDEX idx_videos_status ON public.videos(status);
CREATE INDEX idx_videos_category ON public.videos(category_id);
CREATE INDEX idx_videos_author ON public.videos(author_id);
CREATE INDEX idx_videos_published_at ON public.videos(published_at DESC);

CREATE INDEX idx_media_type ON public.media(file_type);
CREATE INDEX idx_media_author ON public.media(author_id);
CREATE INDEX idx_media_album ON public.media(album_id);

CREATE INDEX idx_comments_video ON public.comments(video_id);
CREATE INDEX idx_comments_media ON public.comments(media_id);
CREATE INDEX idx_comments_author ON public.comments(author_id);
CREATE INDEX idx_comments_status ON public.comments(status);

CREATE INDEX idx_events_start ON public.events(start_date);
CREATE INDEX idx_events_status ON public.events(status);

CREATE INDEX idx_donations_donor ON public.donations(donor_id);
CREATE INDEX idx_donations_status ON public.donations(status);
CREATE INDEX idx_donations_campaign ON public.donations(campaign_id);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);

CREATE INDEX idx_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_sender ON public.chat_messages(sender_id);

CREATE INDEX idx_analytics_video ON public.analytics(video_id);
CREATE INDEX idx_analytics_user ON public.analytics(user_id);
CREATE INDEX idx_analytics_created ON public.analytics(created_at);

-- =====================================================
-- REALTIME: Activer pour les tables nécessaires
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- =====================================================
-- CATÉGORIES PAR DÉFAUT
-- =====================================================
INSERT INTO public.categories (name, slug, description, icon, color, sort_order) VALUES
('Messes', 'messes', 'Célébrations eucharistiques', 'church', '#8B5CF6', 1),
('Homélies', 'homelies', 'Prédications et enseignements', 'book-open', '#F59E0B', 2),
('Catéchèse', 'catechese', 'Formation chrétienne', 'graduation-cap', '#10B981', 3),
('Chorale', 'chorale', 'Chants et musique liturgique', 'music', '#EC4899', 4),
('Événements', 'evenements', 'Activités paroissiales', 'calendar', '#6366F1', 5),
('Témoignages', 'temoignages', 'Partages de foi', 'heart', '#EF4444', 6),
('Jeunesse', 'jeunesse', 'Activités pour les jeunes', 'users', '#14B8A6', 7),
('Prières', 'prieres', 'Moments de prière', 'hands', '#F97316', 8);
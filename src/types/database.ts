// Types pour la base de données paroissiale

export type AppRole = 'admin' | 'moderator' | 'member' | 'guest';
export type ContentStatus = 'draft' | 'pending' | 'published' | 'archived';
export type MediaType = 'video' | 'image' | 'audio' | 'document';
export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';
export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  date_of_birth: string | null;
  is_active: boolean;
  notification_preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  granted_by: string | null;
  granted_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  video_storage_path?: string | null;
  hls_url: string | null;
  duration: number;
  views: number;
  likes_count: number;
  comments_count: number;
  category_id: string | null;
  author_id: string | null;
  status: ContentStatus;
  is_live: boolean;
  is_featured: boolean;
  allow_comments: boolean;
  allow_download: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  author?: Profile;
}

export interface Media {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  thumbnail_url: string | null;
  file_type: MediaType;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  album_id: string | null;
  category_id: string | null;
  author_id: string | null;
  status: ContentStatus;
  is_public: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  views: number;
  downloads: number;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  author?: Profile;
  album?: Album;
}

export interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  author_id: string | null;
  is_public: boolean;
  media_count: number;
  created_at: string;
  updated_at: string;
  // Relations
  author?: Profile;
}

export interface Comment {
  id: string;
  content: string;
  author_id: string;
  video_id: string | null;
  media_id: string | null;
  parent_id: string | null;
  status: CommentStatus;
  likes_count: number;
  replies_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  author?: Profile;
  replies?: Comment[];
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  start_date: string;
  end_date: string | null;
  is_all_day: boolean;
  is_recurring: boolean;
  recurrence_rule: string | null;
  category_id: string | null;
  organizer_id: string | null;
  max_participants: number | null;
  current_participants: number;
  registration_required: boolean;
  registration_deadline: string | null;
  status: ContentStatus;
  // Optional SEO and content fields added for event detail pages
  slug?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  content?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  organizer?: Profile;
}

export interface Donation {
  id: string;
  donor_id: string | null;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  currency: string;
  campaign_id: string | null;
  payment_method: string | null;
  payment_intent_id: string | null;
  status: DonationStatus;
  is_anonymous: boolean;
  is_recurring: boolean;
  recurrence_interval: string | null;
  message: string | null;
  receipt_sent: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
  // Relations
  campaign?: DonationCampaign;
}

export interface DonationCampaign {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  goal_amount: number | null;
  current_amount: number;
  donor_count: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  type: string;
  is_private: boolean;
  created_by: string | null;
  member_count: number;
  last_message_at: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  type: string;
  attachment_url: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  sender?: Profile;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  priority: string;
  is_pinned: boolean;
  author_id: string | null;
  published_at: string;
  expires_at: string | null;
  status: ContentStatus;
  views: number;
  created_at: string;
  updated_at: string;
  // Relations
  author?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PrayerIntention {
  id: string;
  content: string;
  author_id: string | null;
  is_anonymous: boolean;
  is_public: boolean;
  prayer_count: number;
  status: ContentStatus;
  created_at: string;
  // Relations
  author?: Profile;
}

// Types pour les statistiques du dashboard
export interface DashboardStats {
  totalVideos: number;
  totalViews: number;
  totalMembers: number;
  totalDonations: number;
  recentVideos: Video[];
  recentComments: Comment[];
  upcomingEvents: Event[];
}

// =====================================================
// Gallery types
// =====================================================

export interface GalleryCategory {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  title?: string | null;
  description?: string | null;
  image_url: string;
  thumbnail_url?: string | null;
  category_id?: string | null;
  user_id: string;
  views: number;
  is_public: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at?: string | null;
  // Approval status fields
  status?: 'pending' | 'approved' | 'rejected';
  submitted_at?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  rejection_reason?: string | null;
  // Relations
  category?: GalleryCategory;
  user?: Profile;
}

// =====================================================
// Approval system types
// =====================================================

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ContentType = 'video' | 'gallery';

export interface ContentApproval {
  id: string;
  content_type: ContentType;
  content_id: string;
  user_id: string;
  submitted_at: string;
  expires_at: string;
  status: ApprovalStatus;
  title?: string | null;
  description?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  // Relations
  user?: Profile;
  video?: Video;
  gallery?: GalleryImage;
}

export interface PendingApprovalItem {
  id: string;
  type: ContentType;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  user_id: string;
  user_name?: string | null;
  submitted_at: string;
  expires_at: string;
  time_remaining?: string;
  content?: Video | GalleryImage;
}

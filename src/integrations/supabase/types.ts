export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          role: string | null
          parish_role: string | null
          email: string | null
          phone: string | null
          bio: string | null
          join_date: string | null
          is_verified: boolean | null
          settings: Json | null
          last_read_messages_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          parish_role?: string | null
          email?: string | null
          phone?: string | null
          bio?: string | null
          join_date?: string | null
          is_verified?: boolean | null
          settings?: Json | null
          last_read_messages_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          parish_role?: string | null
          email?: string | null
          phone?: string | null
          bio?: string | null
          join_date?: string | null
          is_verified?: boolean | null
          settings?: Json | null
          last_read_messages_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      },
      messages: {
        Row: {
          id: string
          content: string
          sender_id: string
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          sender_id: string
          created_at?: string
        }
        Update: {
          id?: string
          content?: string
          sender_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string | null
          is_read: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body?: string | null
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string | null
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string
          thumbnail_url: string | null
          category_id: string | null
          user_id: string
          views: number | null
          is_public: boolean
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url: string
          thumbnail_url?: string | null
          category_id?: string | null
          user_id: string
          views?: number | null
          is_public?: boolean
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string
          thumbnail_url?: string | null
          category_id?: string | null
          user_id?: string
          views?: number | null
          is_public?: boolean
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gallery_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      homepage_content: {
        Row: {
          id: string
          section: string
          content: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          section: string
          content: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          section?: string
          content?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          id: string
          section_key: string
          title: string | null
          subtitle: string | null
          content: string | null
          content_type: string | null
          metadata: Json | null
          image_url: string | null
          icon: string | null
          display_order: number
          is_active: boolean
          created_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          section_key: string
          title?: string | null
          subtitle?: string | null
          content?: string | null
          content_type?: string | null
          metadata?: Json | null
          image_url?: string | null
          icon?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          section_key?: string
          title?: string | null
          subtitle?: string | null
          content?: string | null
          content_type?: string | null
          metadata?: Json | null
          image_url?: string | null
          icon?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homilies: {
        Row: {
          id: string
          title: string
          priest_name: string | null
          description: string | null
          homily_date: string | null
          video_url: string | null
          image_url: string | null
          duration_minutes: number | null
          created_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          priest_name?: string | null
          description?: string | null
          homily_date?: string | null
          video_url?: string | null
          image_url?: string | null
          duration_minutes?: number | null
          created_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          priest_name?: string | null
          description?: string | null
          homily_date?: string | null
          video_url?: string | null
          image_url?: string | null
          duration_minutes?: number | null
          created_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      about_page_sections: {
        Row: {
          id: string
          section_key: string
          title: string | null
          subtitle: string | null
          content: string | null
          content_type: string | null
          metadata: Json | null
          image_url: string | null
          icon: string | null
          display_order: number
          is_active: boolean
          created_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          section_key: string
          title?: string | null
          subtitle?: string | null
          content?: string | null
          content_type?: string | null
          metadata?: Json | null
          image_url?: string | null
          icon?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          section_key?: string
          title?: string | null
          subtitle?: string | null
          content?: string | null
          content_type?: string | null
          metadata?: Json | null
          image_url?: string | null
          icon?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          id: string
          title: string
          description: string | null
          url: string
          thumbnail_url: string | null
          category: string | null
          user_id: string
          views: number | null
          likes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          url: string
          thumbnail_url?: string | null
          category?: string | null
          user_id: string
          views?: number | null
          likes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          url?: string
          thumbnail_url?: string | null
          category?: string | null
          user_id?: string
          views?: number | null
          likes?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_date: string
          location: string | null
          image_url: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_date: string
          location?: string | null
          image_url?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_date?: string
          location?: string | null
          image_url?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          id: string
          content: string
          user_id: string
          video_id: string | null
          gallery_image_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          user_id: string
          video_id?: string | null
          gallery_image_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          user_id?: string
          video_id?: string | null
          gallery_image_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_gallery_image_id_fkey"
            columns: ["gallery_image_id"]
            isOneToOne: false
            referencedRelation: "gallery_images"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_archives: {
        Row: {
          id: string
          file_name: string
          file_path: string
          file_size: number | null
          description: string | null
          uploaded_by: string | null
          created_at: string
          media_type: string | null
        }
        Insert: {
          id?: string
          file_name: string
          file_path: string
          file_size?: number | null
          description?: string | null
          uploaded_by?: string | null
          created_at?: string
          media_type?: string | null
        }
        Update: {
          id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          description?: string | null
          uploaded_by?: string | null
          created_at?: string
          media_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_archives_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      header_config: {
        Row: {
          id: string
          logo_url: string | null
          logo_alt_text: string
          logo_size: string
          main_title: string
          subtitle: string
          navigation_items: Json
          is_active: boolean
          updated_at: string
          updated_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          logo_url?: string | null
          logo_alt_text?: string
          logo_size?: string
          main_title?: string
          subtitle?: string
          navigation_items?: Json
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          logo_url?: string | null
          logo_alt_text?: string
          logo_size?: string
          main_title?: string
          subtitle?: string
          navigation_items?: Json
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "header_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      directory: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          email: string | null
          phone: string | null
          website: string | null
          image_url: string | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          email?: string | null
          phone?: string | null
          website?: string | null
          image_url?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          email?: string | null
          phone?: string | null
          website?: string | null
          image_url?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directory_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          id: string
          donor_id: string | null
          donor_name: string | null
          donor_email: string | null
          amount: number
          currency: string | null
          payment_method: string | null
          payment_status: string | null
          purpose: string | null
          intention_id: string | null
          notes: Json | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
          is_anonymous: boolean | null
          type: string | null
          amount_value: number | null
          amount_currency: string | null
          description: string | null
          donation_date: string | null
          is_verified: boolean | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          donor_id?: string | null
          donor_name?: string | null
          donor_email?: string | null
          amount: number
          currency?: string | null
          payment_method?: string | null
          payment_status?: string | null
          purpose?: string | null
          intention_id?: string | null
          notes?: Json | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          is_anonymous?: boolean | null
          type?: string | null
          amount_value?: number | null
          amount_currency?: string | null
          description?: string | null
          donation_date?: string | null
          is_verified?: boolean | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          donor_id?: string | null
          donor_name?: string | null
          donor_email?: string | null
          amount?: number
          currency?: string | null
          payment_method?: string | null
          payment_status?: string | null
          purpose?: string | null
          intention_id?: string | null
          notes?: Json | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          is_anonymous?: boolean | null
          type?: string | null
          amount_value?: number | null
          amount_currency?: string | null
          description?: string | null
          donation_date?: string | null
          is_verified?: boolean | null
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_intention_id_fkey"
            columns: ["intention_id"]
            isOneToOne: false
            referencedRelation: "mass_intentions"
            referencedColumns: ["id"]
          },
        ]
      }
      public_advertisements: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          content: string | null
          image_url: string
          pdf_url: string | null
          start_date: string | null
          end_date: string | null
          is_active: boolean
          priority: number
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          content?: string | null
          image_url: string
          pdf_url?: string | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          priority?: number
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string | null
          content?: string | null
          image_url?: string
          pdf_url?: string | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          priority?: number
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_advertisements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database }
    ? PublicTableNameOrOptions
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"]
  : never extends true
    ? never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
          PublicSchema["Views"])
      ? (PublicSchema["Tables"] &
          PublicSchema["Views"])[PublicTableNameOrOptions]
      : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database }
    ? PublicTableNameOrOptions
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database }
    ? PublicTableNameOrOptions
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database }
    ? PublicEnumNameOrOptions
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

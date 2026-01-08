export interface PublicAd {
  id: string;
  title: string;
  subtitle?: string | null;
  content?: string | null;
  image_url: string;
  pdf_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  priority?: number;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

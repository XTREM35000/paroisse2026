export type SystemRole = 'developer' | 'super_admin' | 'admin' | 'member' | 'guest';

export type Role = {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
};

export type UserRole = {
  user_id: string;
  role_name: string;
  is_system: boolean;
  assigned_at?: string;
};

export interface DeveloperSyncResponse {
  success: boolean;
  message: string;
  developer_id?: string;
  developer_email?: string;
  total_parishes?: number;
  added_to?: number;
  error?: string;
}

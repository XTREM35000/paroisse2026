import { supabase } from '@/integrations/supabase/client';

export async function updateProfileRole(targetId: string, role: string) {
  try {
    const res = await supabase.rpc('update_profile_role', { target_id: targetId, new_role: role });
    if (res.error) {
      const msg = res.error.message || JSON.stringify(res.error);
      const err = new Error(`RPC update_profile_role failed: ${msg}`);
      // attach original response for debugging
      (err as any).status = res.status;
      (err as any).details = res.error;
      throw err;
    }
    return res.data;
  } catch (e) {
    console.error('RPC update_profile_role error', e);
    throw e;
  }
}

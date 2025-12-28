import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth"; // Now .tsx file
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useUser() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });

  const profile = query.data ?? null;
  const isAdmin = !!(profile && (profile.role === "admin" || profile.is_admin));

  return { 
    profile, 
    isLoading: query.isLoading, 
    isAdmin, 
    refetch: query.refetch,
  };
}

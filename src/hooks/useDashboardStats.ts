import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboard_stats")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useRegionalStats() {
  return useQuery({
    queryKey: ["regional-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regional_stats")
        .select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
}

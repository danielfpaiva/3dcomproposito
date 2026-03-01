import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      console.log('🔍 useDashboardStats - Fetching from Supabase...');
      const { data, error } = await supabase
        .from("dashboard_stats")
        .select("*")
        .maybeSingle();

      console.log('🔍 useDashboardStats - Response data:', data);
      console.log('🔍 useDashboardStats - Response error:', error);

      if (error) {
        console.error('❌ useDashboardStats - Error fetching stats:', error);
        throw error;
      }

      console.log('✅ useDashboardStats - Successfully fetched:', {
        total_requests: data?.total_requests,
        wheelchairs_completed: data?.wheelchairs_completed,
        parts_in_progress: data?.parts_in_progress,
        total_parts: data?.total_parts,
        parts_completed: data?.parts_completed
      });

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


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';

interface Plan {
  id: string;
  name: string;
  price_kes: number;
  speed_limit_mbps: number;
  validity_days: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePlans = (activeOnly: boolean = true) => {
  return useQuery({
    queryKey: ['plans', activeOnly],
    queryFn: async (): Promise<Plan[]> => {
      let query = supabase.from('plans').select('*').order('price_kes', { ascending: true });
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();

  return useMutation({
    mutationFn: async (planData: Omit<Plan, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('plans')
        .insert([planData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      showSuccess('Success', 'Plan created successfully');
    },
    onError: (error: any) => {
      showError('Error', error.message);
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Plan> & { id: string }) => {
      const { data, error } = await supabase
        .from('plans')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      showSuccess('Success', 'Plan updated successfully');
    },
    onError: (error: any) => {
      showError('Error', error.message);
    },
  });
};

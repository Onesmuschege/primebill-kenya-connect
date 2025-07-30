
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  subscriptions: {
    id: string;
    status: string;
    end_date: string;
    plans: {
      name: string;
      price_kes: number;
    };
  }[];
}

export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          status,
          created_at,
          subscriptions (
            id,
            status,
            end_date,
            plans (
              name,
              price_kes
            )
          )
        `)
        .eq('role', 'client')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useUpdateClientStatus = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();

  return useMutation({
    mutationFn: async ({ clientId, status }: { clientId: string; status: string }) => {
      const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', clientId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      showSuccess('Success', `Client status updated to ${status}`);
    },
    onError: (error: any) => {
      showError('Error', error.message);
    },
  });
};


import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { Users, Phone, Mail, Calendar } from 'lucide-react';
import { SearchAndFilter, FilterOption } from '@/components/search/SearchAndFilter';
import { useSearchAndFilter } from '@/hooks/useSearchAndFilter';

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

export const ClientsManagementImproved = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useNotifications();

  // Filter options for the search component
  const filterOptions: Record<string, FilterOption[]> = {
    status: [
      { key: 'active', label: 'Active', value: 'active' },
      { key: 'inactive', label: 'Inactive', value: 'inactive' },
      { key: 'suspended', label: 'Suspended', value: 'suspended' },
    ],
    subscriptionStatus: [
      { key: 'active', label: 'Has Active Subscription', value: 'active' },
      { key: 'none', label: 'No Subscription', value: 'none' },
    ],
  };

  // Search and filter hook
  const {
    searchTerm,
    filters,
    filteredData: filteredClients,
    handleSearchChange,
    handleFilterChange,
  } = useSearchAndFilter({
    data: clients,
    searchFields: ['name', 'email', 'phone'],
    filterFunctions: {
      status: (client, filterValue) => client.status === filterValue,
      subscriptionStatus: (client, filterValue) => {
        const hasActiveSubscription = client.subscriptions.some(sub => sub.status === 'active');
        return filterValue === 'active' ? hasActiveSubscription : !hasActiveSubscription;
      },
    },
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
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
      setClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      showError('Error loading clients', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateClientStatus = async (clientId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', clientId);

      if (error) throw error;

      showSuccess('Success', `Client status updated to ${newStatus}`);
      fetchClients();
    } catch (error: any) {
      showError('Error', error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSubscriptionStatus = (subscriptions: Client['subscriptions']) => {
    const activeSubscription = subscriptions.find(sub => sub.status === 'active');
    if (activeSubscription) {
      return (
        <div className="text-sm">
          <div className="font-medium text-green-600">Active Plan</div>
          <div className="text-gray-600">{activeSubscription.plans.name}</div>
          <div className="text-gray-500">
            Expires: {new Date(activeSubscription.end_date).toLocaleDateString()}
          </div>
        </div>
      );
    }
    return (
      <div className="text-sm text-gray-500">
        No active subscription
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading clients...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Client Management</h3>
        <div className="text-sm text-gray-500">
          {filteredClients.length} of {clients.length} clients
        </div>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        filterOptions={filterOptions}
        placeholder="Search clients by name, email, or phone..."
      />

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{client.name}</CardTitle>
                {getStatusBadge(client.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {client.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {client.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Joined {new Date(client.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="border-t pt-4">
                {getSubscriptionStatus(client.subscriptions)}
              </div>

              <div className="flex space-x-2 pt-4">
                {client.status === 'active' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateClientStatus(client.id, 'suspended')}
                    className="text-red-600 hover:text-red-700"
                  >
                    Suspend
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateClientStatus(client.id, 'active')}
                    className="text-green-600 hover:text-green-700"
                  >
                    Activate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-500">
            {searchTerm || Object.values(filters).some(f => f) 
              ? 'No clients match your search criteria.' 
              : 'No clients have signed up yet.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

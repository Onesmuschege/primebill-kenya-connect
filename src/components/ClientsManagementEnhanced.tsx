import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar, 
  Search, 
  MoreVertical,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Shield,
  ShieldAlert,
  Activity
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'blocked' | 'suspended';
  role: string;
  created_at: string;
  last_login?: string;
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

export const ClientsManagementEnhanced = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [actionType, setActionType] = useState<'block' | 'activate' | 'delete' | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          status,
          role,
          created_at,
          last_login,
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
        .neq('role', 'admin') // Don't show admin users
        .neq('role', 'subadmin') // Don't show subadmin users if current user is not admin
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientAction = async () => {
    if (!selectedClient || !actionType) return;

    try {
      setProcessingAction(true);
      
      let newStatus = selectedClient.status;
      let actionDescription = '';

      switch (actionType) {
        case 'block':
          newStatus = 'blocked';
          actionDescription = 'blocked';
          break;
        case 'activate':
          newStatus = 'active';
          actionDescription = 'activated';
          break;
        case 'delete':
          // In a real implementation, you might soft delete or archive instead
          actionDescription = 'deleted';
          break;
      }

      if (actionType === 'delete') {
        // Soft delete by updating status
        const { error } = await supabase
          .from('users')
          .update({ status: 'deleted' })
          .eq('id', selectedClient.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('users')
          .update({ status: newStatus })
          .eq('id', selectedClient.id);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Client ${actionDescription} successfully`,
      });

      // Refresh the clients list
      await fetchClients();
      
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: `Failed to ${actionType} client`,
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
      setShowActionDialog(false);
      setSelectedClient(null);
      setActionType(null);
    }
  };

  const openActionDialog = (client: Client, action: 'block' | 'activate' | 'delete') => {
    setSelectedClient(client);
    setActionType(action);
    setShowActionDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'status-active',
      blocked: 'bg-red-100 text-red-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      deleted: 'bg-gray-100 text-gray-800',
    } as const;

    const icons = {
      active: <UserCheck className="h-3 w-3 mr-1" />,
      blocked: <UserX className="h-3 w-3 mr-1" />,
      suspended: <ShieldAlert className="h-3 w-3 mr-1" />,
      deleted: <UserX className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.active}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const getActionDialogContent = () => {
    if (!selectedClient || !actionType) return { title: '', description: '' };

    const actions = {
      block: {
        title: 'Block Client',
        description: `Are you sure you want to block ${selectedClient.name}? This will prevent them from accessing their account and services.`
      },
      activate: {
        title: 'Activate Client',
        description: `Are you sure you want to activate ${selectedClient.name}? This will restore their access to the account and services.`
      },
      delete: {
        title: 'Delete Client',
        description: `Are you sure you want to delete ${selectedClient.name}? This action cannot be undone and will remove all their data.`
      }
    };

    return actions[actionType];
  };

  if (loading) {
    return (
      <Card className="professional-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-isp-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading clients...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="professional-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-isp-blue-600" />
              <div>
                <CardTitle className="text-xl font-heading">Client Management</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Manage user accounts, subscriptions, and access permissions
                </p>
              </div>
            </div>
            <Badge className="bg-isp-blue-100 text-isp-blue-800">
              {filteredClients.length} Clients
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card className="professional-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={fetchClients}
              variant="outline"
              className="bg-white hover:bg-isp-gray-50"
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="professional-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-isp-gray-50">
                <TableHead className="font-semibold text-gray-700">Client</TableHead>
                <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Subscription</TableHead>
                <TableHead className="font-semibold text-gray-700">Joined</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-isp-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-isp-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-isp-blue-700 font-medium text-sm">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-3 w-3 mr-2" />
                        {client.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-3 w-3 mr-2" />
                        {client.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(client.status)}
                  </TableCell>
                  <TableCell>
                    {client.subscriptions.length > 0 ? (
                      <div>
                        <div className="font-medium text-gray-900">
                          {client.subscriptions[0].plans.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          KES {client.subscriptions[0].plans.price_kes.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No active subscription</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {new Date(client.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Client
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {client.status === 'active' ? (
                          <DropdownMenuItem 
                            className="cursor-pointer text-yellow-600"
                            onClick={() => openActionDialog(client, 'block')}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Block Client
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            className="cursor-pointer text-green-600"
                            onClick={() => openActionDialog(client, 'activate')}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activate Client
                          </DropdownMenuItem>
                        )}
                        
                        {user?.role === 'admin' && (
                          <DropdownMenuItem 
                            className="cursor-pointer text-red-600"
                            onClick={() => openActionDialog(client, 'delete')}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Delete Client
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getActionDialogContent().title}</AlertDialogTitle>
            <AlertDialogDescription>
              {getActionDialogContent().description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClientAction}
              disabled={processingAction}
              className={actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {processingAction ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
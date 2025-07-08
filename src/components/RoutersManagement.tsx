
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Wifi, WifiOff, Settings } from 'lucide-react';

interface Router {
  id: string;
  location_name: string;
  ip_address: string;
  api_port: number;
  username: string;
  password_encrypted: string;
  status: 'online' | 'offline' | 'maintenance';
  last_seen: string | null;
  created_at: string;
  updated_at: string;
}

export const RoutersManagement = () => {
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRouter, setNewRouter] = useState({
    location_name: '',
    ip_address: '',
    api_port: 8728,
    username: '',
    password_encrypted: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRouters();
  }, []);

  const fetchRouters = async () => {
    try {
      const { data, error } = await supabase
        .from('routers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to handle the ip_address field
      const routersData = (data || []).map(router => ({
        ...router,
        ip_address: String(router.ip_address),
      })) as Router[];
      
      setRouters(routersData);
    } catch (error) {
      console.error('Error fetching routers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch routers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRouter = async () => {
    try {
      const { error } = await supabase
        .from('routers')
        .insert([newRouter]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Router added successfully",
      });

      setShowAddForm(false);
      setNewRouter({
        location_name: '',
        ip_address: '',
        api_port: 8728,
        username: '',
        password_encrypted: '',
      });
      fetchRouters();
    } catch (error) {
      console.error('Error adding router:', error);
      toast({
        title: "Error",
        description: "Failed to add router",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-600" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-yellow-600" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      online: 'default',
      offline: 'destructive',
      maintenance: 'secondary',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {getStatusIcon(status)}
        <span className="ml-1">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading routers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Router Management</h3>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Router
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Router</CardTitle>
            <CardDescription>Configure a new MikroTik router</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Location Name</label>
                <Input
                  value={newRouter.location_name}
                  onChange={(e) => setNewRouter({ ...newRouter, location_name: e.target.value })}
                  placeholder="e.g., Nairobi Central"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">IP Address</label>
                <Input
                  value={newRouter.ip_address}
                  onChange={(e) => setNewRouter({ ...newRouter, ip_address: e.target.value })}
                  placeholder="192.168.1.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">API Port</label>
                <Input
                  type="number"
                  value={newRouter.api_port}
                  onChange={(e) => setNewRouter({ ...newRouter, api_port: parseInt(e.target.value) })}
                  placeholder="8728"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input
                  value={newRouter.username}
                  onChange={(e) => setNewRouter({ ...newRouter, username: e.target.value })}
                  placeholder="admin"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  value={newRouter.password_encrypted}
                  onChange={(e) => setNewRouter({ ...newRouter, password_encrypted: e.target.value })}
                  placeholder="Router password"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAddRouter}>Add Router</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routers.map((router) => (
          <Card key={router.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{router.location_name}</CardTitle>
                {getStatusBadge(router.status)}
              </div>
              <CardDescription>{router.ip_address}:{router.api_port}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Username:</span> {router.username}
                </div>
                {router.last_seen && (
                  <div>
                    <span className="font-medium">Last Seen:</span>{' '}
                    {new Date(router.last_seen).toLocaleString()}
                  </div>
                )}
                <div>
                  <span className="font-medium">Added:</span>{' '}
                  {new Date(router.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {routers.length === 0 && (
        <div className="text-center py-8">
          <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No routers configured</h3>
          <p className="text-gray-500">Add your first MikroTik router to get started.</p>
        </div>
      )}
    </div>
  );
};

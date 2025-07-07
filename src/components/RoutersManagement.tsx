
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Wifi, MapPin, Clock } from 'lucide-react';

interface Router {
  id: string;
  location_name: string;
  ip_address: string;
  api_port: number;
  username: string;
  password_encrypted: string;
  status: string;
  last_seen: string | null;
  created_at: string;
}

export const RoutersManagement = () => {
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRouter, setEditingRouter] = useState<Router | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    location_name: '',
    ip_address: '',
    api_port: '8728',
    username: '',
    password: '',
    status: 'offline',
  });

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
      setRouters(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const routerData = {
        location_name: formData.location_name,
        ip_address: formData.ip_address,
        api_port: parseInt(formData.api_port),
        username: formData.username,
        password_encrypted: formData.password, // In production, this should be properly encrypted
        status: formData.status as 'online' | 'offline' | 'maintenance',
      };

      if (editingRouter) {
        const { error } = await supabase
          .from('routers')
          .update(routerData)
          .eq('id', editingRouter.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('routers')
          .insert([routerData]);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Router ${editingRouter ? 'updated' : 'created'} successfully`,
      });

      setDialogOpen(false);
      resetForm();
      fetchRouters();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      location_name: '',
      ip_address: '',
      api_port: '8728',
      username: '',
      password: '',
      status: 'offline',
    });
    setEditingRouter(null);
  };

  const handleEdit = (router: Router) => {
    setEditingRouter(router);
    setFormData({
      location_name: router.location_name,
      ip_address: router.ip_address,
      api_port: router.api_port.toString(),
      username: router.username,
      password: '', // Don't prefill password for security
      status: router.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (routerId: string) => {
    if (!confirm('Are you sure you want to delete this router?')) return;

    try {
      const { error } = await supabase
        .from('routers')
        .delete()
        .eq('id', routerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Router deleted successfully",
      });
      fetchRouters();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      online: 'default',
      offline: 'secondary',
      maintenance: 'destructive',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Router
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRouter ? 'Edit Router' : 'Add New Router'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location Name</Label>
                <Input
                  id="location"
                  value={formData.location_name}
                  onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                  placeholder="e.g., Main Office, Branch A"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ip">IP Address</Label>
                  <Input
                    id="ip"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    placeholder="192.168.1.1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">API Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={formData.api_port}
                    onChange={(e) => setFormData({ ...formData, api_port: e.target.value })}
                    placeholder="8728"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingRouter ? "Leave blank to keep current password" : ""}
                  required={!editingRouter}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <Button type="submit" className="w-full">
                {editingRouter ? 'Update Router' : 'Add Router'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routers.map((router) => (
          <Card key={router.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  {router.location_name}
                </CardTitle>
                {getStatusBadge(router.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Wifi className="h-4 w-4 mr-2" />
                  {router.ip_address}:{router.api_port}
                </div>
                <div className="text-sm text-gray-600">
                  Username: <span className="font-mono">{router.username}</span>
                </div>
                {router.last_seen && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Last seen: {new Date(router.last_seen).toLocaleString()}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(router)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(router.id)}
                  className="text-red-600 hover:text-red-700"
                >
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
          <p className="text-gray-500">
            Add your first router to start managing network access.
          </p>
        </div>
      )}
    </div>
  );
};

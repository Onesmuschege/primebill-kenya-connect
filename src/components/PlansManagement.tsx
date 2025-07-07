
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Zap, Clock, DollarSign } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price_kes: number;
  speed_limit_mbps: number;
  validity_days: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export const PlansManagement = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    price_kes: '',
    speed_limit_mbps: '',
    validity_days: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planData = {
        name: formData.name,
        price_kes: parseFloat(formData.price_kes),
        speed_limit_mbps: parseInt(formData.speed_limit_mbps),
        validity_days: parseInt(formData.validity_days),
        description: formData.description || null,
        is_active: formData.is_active,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('plans')
          .insert([planData]);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Plan ${editingPlan ? 'updated' : 'created'} successfully`,
      });

      setDialogOpen(false);
      resetForm();
      fetchPlans();
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
      name: '',
      price_kes: '',
      speed_limit_mbps: '',
      validity_days: '',
      description: '',
      is_active: true,
    });
    setEditingPlan(null);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price_kes: plan.price_kes.toString(),
      speed_limit_mbps: plan.speed_limit_mbps.toString(),
      validity_days: plan.validity_days.toString(),
      description: plan.description || '',
      is_active: plan.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });
      fetchPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading plans...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Internet Plans</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (KES)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price_kes}
                    onChange={(e) => setFormData({ ...formData, price_kes: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speed">Speed (Mbps)</Label>
                  <Input
                    id="speed"
                    type="number"
                    value={formData.speed_limit_mbps}
                    onChange={(e) => setFormData({ ...formData, speed_limit_mbps: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="validity">Validity (Days)</Label>
                <Input
                  id="validity"
                  type="number"
                  value={formData.validity_days}
                  onChange={(e) => setFormData({ ...formData, validity_days: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Plan description..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Active Plan</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex space-x-2">
                  {plan.is_active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-blue-600">
                KES {plan.price_kes.toLocaleString()}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Zap className="h-4 w-4 mr-2" />
                  {plan.speed_limit_mbps} Mbps
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {plan.validity_days} days
                </div>
              </div>
              
              {plan.description && (
                <p className="text-sm text-gray-600">{plan.description}</p>
              )}
              
              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(plan)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(plan.id)}
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
    </div>
  );
};

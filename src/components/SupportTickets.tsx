import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, MessageCircle, Clock, CheckCircle, X, AlertCircle, User } from 'lucide-react';
import { format } from 'date-fns';

interface SupportTicket {
  id: string;
  user_id: string;
  assigned_to: string | null;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: 'technical' | 'billing' | 'general' | 'network' | 'account';
  internal_notes: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  users: {
    name: string;
    email: string;
    phone: string;
  };
  assigned_user?: {
    name: string;
    email: string;
  };
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
};

const categoryIcons = {
  technical: AlertCircle,
  billing: '💰',
  general: MessageCircle,
  network: '📡',
  account: User
};

export const SupportTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [staff, setStaff] = useState<Array<{ id: string; name: string; email: string }>>([]);
  
  // Form states
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'general' as const,
    priority: 'medium' as const
  });
  
  const [ticketUpdate, setTicketUpdate] = useState({
    status: '',
    assigned_to: '',
    internal_notes: '',
    resolution_notes: ''
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'subadmin';

  useEffect(() => {
    fetchTickets();
    if (isAdmin) {
      fetchStaff();
    }
  }, [user, isAdmin]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          users!support_tickets_user_id_fkey (name, email, phone),
          assigned_user:users!support_tickets_assigned_to_fkey (name, email)
        `)
        .order('created_at', { ascending: false });

      // If not admin, only show user's own tickets
      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch support tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .in('role', ['admin', 'subadmin']);

      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
    }
  };

  const createTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: user?.id,
          title: newTicket.title,
          description: newTicket.description,
          category: newTicket.category,
          priority: newTicket.priority
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Support ticket created successfully",
      });

      setNewTicket({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium'
      });
      setIsCreateDialogOpen(false);
      fetchTickets();

      // Send notification to admins
      await supabase.functions.invoke('sms-notifications', {
        body: {
          phone: '+254700000000', // Admin phone number
          message: `New support ticket: ${newTicket.title} from ${user?.name}`,
          type: 'support_update'
        }
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create support ticket",
        variant: "destructive",
      });
    }
  };

  const updateTicket = async (ticketId: string) => {
    try {
      const updateData: any = {};
      
      if (ticketUpdate.status) updateData.status = ticketUpdate.status;
      if (ticketUpdate.assigned_to) updateData.assigned_to = ticketUpdate.assigned_to;
      if (ticketUpdate.internal_notes) updateData.internal_notes = ticketUpdate.internal_notes;
      if (ticketUpdate.resolution_notes) updateData.resolution_notes = ticketUpdate.resolution_notes;
      
      if (ticketUpdate.status === 'resolved' || ticketUpdate.status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });

      fetchTickets();
      setSelectedTicket(null);

      // Send notification to customer if status changed
      if (ticketUpdate.status && selectedTicket) {
        const customer = selectedTicket.users;
        let message = '';
        
        switch (ticketUpdate.status) {
          case 'in_progress':
            message = `Your support ticket "${selectedTicket.title}" is now being worked on.`;
            break;
          case 'resolved':
            message = `Your support ticket "${selectedTicket.title}" has been resolved. Resolution: ${ticketUpdate.resolution_notes || 'Check your account for updates.'}`;
            break;
          case 'closed':
            message = `Your support ticket "${selectedTicket.title}" has been closed.`;
            break;
        }

        if (message) {
          await supabase.functions.invoke('sms-notifications', {
            body: {
              phone: customer.phone,
              message: message,
              user_id: selectedTicket.user_id,
              type: 'support_update'
            }
          });

          await supabase.functions.invoke('email-notifications', {
            body: {
              email: customer.email,
              subject: `Support Ticket Update - ${selectedTicket.title}`,
              message: message,
              user_id: selectedTicket.user_id,
              type: 'support_update'
            }
          });
        }
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <X className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Support Tickets</h2>
          <p className="text-muted-foreground">
            {isAdmin ? 'Manage customer support requests' : 'View and create support tickets'}
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and we'll help you resolve it.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  placeholder="Brief description of your issue"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newTicket.category} onValueChange={(value) => setNewTicket({ ...newTicket, category: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTicket.priority} onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Detailed description of your issue..."
                  rows={4}
                />
              </div>
              
              <Button onClick={createTicket} className="w-full">
                Create Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tickets List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {tickets.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="mx-auto h-12 w-12 mb-4" />
                  <p>No support tickets found</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTicket(ticket)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(ticket.status)}
                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={priorityColors[ticket.priority]}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={statusColors[ticket.status]}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      {ticket.category} • Created {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                      {isAdmin && (
                        <> • Customer: {ticket.users.name}</>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.description}
                    </p>
                    {ticket.assigned_user && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Assigned to: {ticket.assigned_user.name}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Filter tabs for different statuses */}
        {['open', 'in_progress', 'resolved'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            <div className="grid gap-4">
              {tickets.filter(ticket => ticket.status === status).map((ticket) => (
                <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTicket(ticket)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(ticket.status)}
                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                      </div>
                      <Badge className={priorityColors[ticket.priority]}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <CardDescription>
                      {ticket.category} • Created {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                      {isAdmin && (
                        <> • Customer: {ticket.users.name}</>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Ticket Detail Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl">{selectedTicket.title}</DialogTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={priorityColors[selectedTicket.priority]}>
                    {selectedTicket.priority}
                  </Badge>
                  <Badge className={statusColors[selectedTicket.status]}>
                    {selectedTicket.status}
                  </Badge>
                </div>
              </div>
              <DialogDescription>
                Ticket #{selectedTicket.id.slice(0, 8)} • {selectedTicket.category}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Customer Info (Admin view) */}
              {isAdmin && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Customer Information</h4>
                  <div className="bg-muted p-3 rounded-lg">
                    <p><strong>Name:</strong> {selectedTicket.users.name}</p>
                    <p><strong>Email:</strong> {selectedTicket.users.email}</p>
                    <p><strong>Phone:</strong> {selectedTicket.users.phone}</p>
                  </div>
                </div>
              )}

              {/* Ticket Details */}
              <div className="space-y-2">
                <h4 className="font-semibold">Description</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Internal Notes (Admin only) */}
              {isAdmin && selectedTicket.internal_notes && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Internal Notes</h4>
                  <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                    <p className="whitespace-pre-wrap">{selectedTicket.internal_notes}</p>
                  </div>
                </div>
              )}

              {/* Resolution Notes */}
              {selectedTicket.resolution_notes && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Resolution</h4>
                  <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                    <p className="whitespace-pre-wrap">{selectedTicket.resolution_notes}</p>
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {isAdmin && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold">Admin Actions</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={ticketUpdate.status} onValueChange={(value) => setTicketUpdate({ ...ticketUpdate, status: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="assigned_to">Assign To</Label>
                      <Select value={ticketUpdate.assigned_to} onValueChange={(value) => setTicketUpdate({ ...ticketUpdate, assigned_to: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign staff" />
                        </SelectTrigger>
                        <SelectContent>
                          {staff.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="internal_notes">Internal Notes</Label>
                    <Textarea
                      id="internal_notes"
                      value={ticketUpdate.internal_notes}
                      onChange={(e) => setTicketUpdate({ ...ticketUpdate, internal_notes: e.target.value })}
                      placeholder="Internal notes (not visible to customer)"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="resolution_notes">Resolution Notes</Label>
                    <Textarea
                      id="resolution_notes"
                      value={ticketUpdate.resolution_notes}
                      onChange={(e) => setTicketUpdate({ ...ticketUpdate, resolution_notes: e.target.value })}
                      placeholder="Resolution details (visible to customer)"
                      rows={3}
                    />
                  </div>
                  
                  <Button onClick={() => updateTicket(selectedTicket.id)} className="w-full">
                    Update Ticket
                  </Button>
                </div>
              )}

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
                <p>Created: {format(new Date(selectedTicket.created_at), 'PPpp')}</p>
                <p>Updated: {format(new Date(selectedTicket.updated_at), 'PPpp')}</p>
                {selectedTicket.resolved_at && (
                  <p>Resolved: {format(new Date(selectedTicket.resolved_at), 'PPpp')}</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
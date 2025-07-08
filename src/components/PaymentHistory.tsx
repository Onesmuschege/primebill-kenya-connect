
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Search, Calendar, Phone, Receipt } from 'lucide-react';

interface Payment {
  id: string;
  amount_kes: number;
  method: string;
  mpesa_code: string | null;
  mpesa_receipt_number: string | null;
  phone_number: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
}

export const PaymentHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchPayments();
      
      // Set up real-time subscription for payment updates
      const channel = supabase
        .channel('payment-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchPayments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchPayments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      pending: 'secondary',
      failed: 'destructive',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredPayments = payments.filter(payment =>
    payment.mpesa_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.phone_number?.includes(searchTerm) ||
    payment.amount_kes.toString().includes(searchTerm)
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading payment history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Receipt className="h-5 w-5 mr-2" />
          Payment History
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by amount, M-Pesa code, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No payments match your search.' : 'No payment history yet.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-lg">
                    KES {Number(payment.amount_kes).toLocaleString()}
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  {payment.phone_number && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {payment.phone_number}
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(payment.created_at).toLocaleDateString()} at{' '}
                    {new Date(payment.created_at).toLocaleTimeString()}
                  </div>
                  
                  {payment.mpesa_code && (
                    <div className="text-xs">
                      M-Pesa Code: <span className="font-mono">{payment.mpesa_code}</span>
                    </div>
                  )}
                  
                  {payment.mpesa_receipt_number && (
                    <div className="text-xs">
                      Receipt: <span className="font-mono">{payment.mpesa_receipt_number}</span>
                    </div>
                  )}
                  
                  {payment.paid_at && (
                    <div className="text-xs text-green-600">
                      Paid: {new Date(payment.paid_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

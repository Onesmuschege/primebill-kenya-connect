
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Search, Calendar, DollarSign } from 'lucide-react';

interface Payment {
  id: string;
  amount_kes: number;
  method: string;
  mpesa_code: string | null;
  phone_number: string | null;
  status: string;
  created_at: string;
  users: {
    name: string;
    email: string;
    phone: string;
  };
}

export const PaymentsManagement = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount_kes,
          method,
          mpesa_code,
          phone_number,
          status,
          created_at,
          users (
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.users.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.users.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.mpesa_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.phone_number?.includes(searchTerm)
  );

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

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      MPESA: 'bg-green-100 text-green-800',
      CASH: 'bg-blue-100 text-blue-800',
      BANK_TRANSFER: 'bg-purple-100 text-purple-800',
    } as const;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {method}
      </span>
    );
  };

  const totalRevenue = filteredPayments
    .filter(payment => payment.status === 'success')
    .reduce((sum, payment) => sum + Number(payment.amount_kes), 0);

  if (loading) {
    return <div className="flex justify-center p-8">Loading payments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payment Management</h3>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Revenue Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            KES {totalRevenue.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Total from {filteredPayments.filter(p => p.status === 'success').length} successful payments
          </p>
        </CardContent>
      </Card>

      {/* Payments List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPayments.map((payment) => (
          <Card key={payment.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{payment.users.name}</h4>
                    {getStatusBadge(payment.status)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {payment.users.email} • {payment.users.phone}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Amount: KES {Number(payment.amount_kes).toLocaleString()}</span>
                    {getPaymentMethodBadge(payment.method)}
                  </div>
                  {payment.mpesa_code && (
                    <div className="text-sm text-gray-600">
                      M-Pesa Code: <span className="font-mono">{payment.mpesa_code}</span>
                    </div>
                  )}
                  {payment.phone_number && (
                    <div className="text-sm text-gray-600">
                      Payment Phone: {payment.phone_number}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    KES {Number(payment.amount_kes).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(payment.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'No payments match your search criteria.' : 'No payments have been made yet.'}
          </p>
        </div>
      )}
    </div>
  );
};

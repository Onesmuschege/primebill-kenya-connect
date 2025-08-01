import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Calendar, TrendingUp, Users, DollarSign, Wifi, FileText, BarChart3, PieChart } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, subDays, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie as RechartsPie, Cell, LineChart, Line } from 'recharts';
import { CSVLink } from 'react-csv';

interface RevenueData {
  total_revenue: number;
  period_revenue: number;
  payment_count: number;
  average_transaction: number;
}

interface CustomerData {
  total_customers: number;
  new_customers: number;
  active_subscriptions: number;
  churn_rate: number;
}

interface PlanData {
  plan_name: string;
  revenue: number;
  customer_count: number;
  percentage: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  customers: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const ReportsAnalytics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [reportType, setReportType] = useState('monthly');
  
  // Analytics data
  const [revenueData, setRevenueData] = useState<RevenueData>({
    total_revenue: 0,
    period_revenue: 0,
    payment_count: 0,
    average_transaction: 0
  });
  
  const [customerData, setCustomerData] = useState<CustomerData>({
    total_customers: 0,
    new_customers: 0,
    active_subscriptions: 0,
    churn_rate: 0
  });
  
  const [planData, setPlanData] = useState<PlanData[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [exportData, setExportData] = useState<any[]>([]);

  const isAdmin = user?.role === 'admin' || user?.role === 'subadmin';

  useEffect(() => {
    if (isAdmin) {
      fetchAnalyticsData();
    }
  }, [dateRange, isAdmin]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRevenueData(),
        fetchCustomerData(),
        fetchPlanData(),
        fetchDailyRevenue()
      ]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async () => {
    try {
      // Total revenue
      const { data: totalRevenue } = await supabase
        .from('payments')
        .select('amount_kes')
        .eq('status', 'success');

      // Period revenue
      const { data: periodRevenue } = await supabase
        .from('payments')
        .select('amount_kes')
        .eq('status', 'success')
        .gte('created_at', `${dateRange.from}T00:00:00`)
        .lte('created_at', `${dateRange.to}T23:59:59`);

      const total = totalRevenue?.reduce((sum, payment) => sum + Number(payment.amount_kes), 0) || 0;
      const period = periodRevenue?.reduce((sum, payment) => sum + Number(payment.amount_kes), 0) || 0;
      const count = periodRevenue?.length || 0;

      setRevenueData({
        total_revenue: total,
        period_revenue: period,
        payment_count: count,
        average_transaction: count > 0 ? period / count : 0
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  const fetchCustomerData = async () => {
    try {
      // Total customers
      const { data: totalCustomers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'client');

      // New customers in period
      const { data: newCustomers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'client')
        .gte('created_at', `${dateRange.from}T00:00:00`)
        .lte('created_at', `${dateRange.to}T23:59:59`);

      // Active subscriptions
      const { data: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0]);

      setCustomerData({
        total_customers: totalCustomers?.length || 0,
        new_customers: newCustomers?.length || 0,
        active_subscriptions: activeSubscriptions?.length || 0,
        churn_rate: 0 // Calculate based on your business logic
      });
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  const fetchPlanData = async () => {
    try {
      const { data: planRevenue } = await supabase
        .from('payments')
        .select(`
          amount_kes,
          subscriptions!inner (
            plans!inner (
              name
            )
          )
        `)
        .eq('status', 'success')
        .gte('created_at', `${dateRange.from}T00:00:00`)
        .lte('created_at', `${dateRange.to}T23:59:59`);

      if (planRevenue) {
        const planStats: { [key: string]: { revenue: number; count: number } } = {};
        
        planRevenue.forEach(payment => {
          const planName = (payment.subscriptions as any)?.plans?.name || 'Unknown';
          if (!planStats[planName]) {
            planStats[planName] = { revenue: 0, count: 0 };
          }
          planStats[planName].revenue += Number(payment.amount_kes);
          planStats[planName].count += 1;
        });

        const totalRevenue = Object.values(planStats).reduce((sum, plan) => sum + plan.revenue, 0);
        
        const planDataArray = Object.entries(planStats).map(([name, stats]) => ({
          plan_name: name,
          revenue: stats.revenue,
          customer_count: stats.count,
          percentage: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0
        }));

        setPlanData(planDataArray);
      }
    } catch (error) {
      console.error('Error fetching plan data:', error);
    }
  };

  const fetchDailyRevenue = async () => {
    try {
      const { data: dailyPayments } = await supabase
        .from('payments')
        .select('amount_kes, created_at, user_id')
        .eq('status', 'success')
        .gte('created_at', `${dateRange.from}T00:00:00`)
        .lte('created_at', `${dateRange.to}T23:59:59`)
        .order('created_at');

      if (dailyPayments) {
        const dailyStats: { [key: string]: { revenue: number; customers: Set<string> } } = {};
        
        dailyPayments.forEach(payment => {
          const date = format(new Date(payment.created_at), 'yyyy-MM-dd');
          if (!dailyStats[date]) {
            dailyStats[date] = { revenue: 0, customers: new Set() };
          }
          dailyStats[date].revenue += Number(payment.amount_kes);
          dailyStats[date].customers.add(payment.user_id);
        });

        const dailyArray = Object.entries(dailyStats).map(([date, stats]) => ({
          date: format(new Date(date), 'MMM dd'),
          revenue: stats.revenue,
          customers: stats.customers.size
        }));

        setDailyRevenue(dailyArray);
      }
    } catch (error) {
      console.error('Error fetching daily revenue:', error);
    }
  };

  const generateCSVData = async (type: string) => {
    try {
      setLoading(true);
      let csvData: any[] = [];

      switch (type) {
        case 'revenue':
          const { data: revenueCSV } = await supabase
            .from('payments')
            .select(`
              id, amount_kes, method, status, created_at,
              users (name, email, phone),
              subscriptions (
                plans (name)
              )
            `)
            .eq('status', 'success')
            .gte('created_at', `${dateRange.from}T00:00:00`)
            .lte('created_at', `${dateRange.to}T23:59:59`)
            .order('created_at', { ascending: false });

          csvData = revenueCSV?.map(payment => ({
            'Payment ID': payment.id,
            'Customer Name': payment.users?.name || 'N/A',
            'Customer Email': payment.users?.email || 'N/A',
            'Customer Phone': payment.users?.phone || 'N/A',
            'Amount (KES)': payment.amount_kes,
            'Payment Method': payment.method,
            'Plan': (payment.subscriptions as any)?.plans?.name || 'N/A',
            'Date': format(new Date(payment.created_at), 'yyyy-MM-dd HH:mm'),
            'Status': payment.status
          })) || [];
          break;

        case 'customers':
          const { data: customersCSV } = await supabase
            .from('users')
            .select(`
              id, name, email, phone, status, created_at,
              subscriptions (
                status, start_date, end_date,
                plans (name, price_kes)
              )
            `)
            .eq('role', 'client')
            .gte('created_at', `${dateRange.from}T00:00:00`)
            .lte('created_at', `${dateRange.to}T23:59:59`)
            .order('created_at', { ascending: false });

          csvData = customersCSV?.map(customer => {
            const activeSubscription = customer.subscriptions?.find(sub => sub.status === 'active');
            return {
              'Customer ID': customer.id,
              'Name': customer.name,
              'Email': customer.email,
              'Phone': customer.phone,
              'Status': customer.status,
              'Registration Date': format(new Date(customer.created_at), 'yyyy-MM-dd'),
              'Current Plan': activeSubscription?.plans?.name || 'None',
              'Plan Price': activeSubscription?.plans?.price_kes || 0,
              'Subscription End': activeSubscription?.end_date || 'N/A'
            };
          }) || [];
          break;

        case 'subscriptions':
          const { data: subscriptionsCSV } = await supabase
            .from('subscriptions')
            .select(`
              id, status, start_date, end_date, auto_renew, created_at,
              users (name, email, phone),
              plans (name, price_kes, speed_limit_mbps, validity_days),
              payments (amount_kes, method, status)
            `)
            .gte('created_at', `${dateRange.from}T00:00:00`)
            .lte('created_at', `${dateRange.to}T23:59:59`)
            .order('created_at', { ascending: false });

          csvData = subscriptionsCSV?.map(subscription => ({
            'Subscription ID': subscription.id,
            'Customer Name': subscription.users?.name || 'N/A',
            'Customer Email': subscription.users?.email || 'N/A',
            'Customer Phone': subscription.users?.phone || 'N/A',
            'Plan Name': subscription.plans?.name || 'N/A',
            'Plan Price': subscription.plans?.price_kes || 0,
            'Speed (Mbps)': subscription.plans?.speed_limit_mbps || 0,
            'Validity (Days)': subscription.plans?.validity_days || 0,
            'Start Date': subscription.start_date,
            'End Date': subscription.end_date,
            'Status': subscription.status,
            'Auto Renew': subscription.auto_renew ? 'Yes' : 'No',
            'Payment Amount': subscription.payments?.amount_kes || 0,
            'Payment Method': subscription.payments?.method || 'N/A',
            'Payment Status': subscription.payments?.status || 'N/A',
            'Created Date': format(new Date(subscription.created_at), 'yyyy-MM-dd HH:mm')
          })) || [];
          break;
      }

      setExportData(csvData);
      return csvData;
    } catch (error) {
      console.error('Error generating CSV data:', error);
      toast({
        title: "Error",
        description: "Failed to generate export data",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = async () => {
    try {
      setLoading(true);
      // Generate PDF using jsPDF or similar library
      // For now, we'll show a message that PDF generation is in progress
      toast({
        title: "PDF Generation",
        description: "PDF report generation is not implemented yet. Use CSV export for now.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setQuickDateRange = (type: string) => {
    const now = new Date();
    let from: Date, to: Date;

    switch (type) {
      case 'today':
        from = startOfDay(now);
        to = endOfDay(now);
        break;
      case 'yesterday':
        from = startOfDay(subDays(now, 1));
        to = endOfDay(subDays(now, 1));
        break;
      case 'week':
        from = startOfWeek(now);
        to = endOfWeek(now);
        break;
      case 'month':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'last-month':
        from = startOfMonth(subMonths(now, 1));
        to = endOfMonth(subMonths(now, 1));
        break;
      default:
        return;
    }

    setDateRange({
      from: format(from, 'yyyy-MM-dd'),
      to: format(to, 'yyyy-MM-dd')
    });
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="mx-auto h-12 w-12 mb-4" />
            <p>Access denied. Admin privileges required.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive business insights and data export
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from">From</Label>
                <Input
                  id="from"
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange('today')}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange('week')}>
                This Week
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange('month')}>
                This Month
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange('last-month')}>
                Last Month
              </Button>
            </div>
            
            <Button onClick={fetchAnalyticsData} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Period Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {revenueData.period_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {revenueData.payment_count} transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerData.new_customers}</div>
            <p className="text-xs text-muted-foreground">
              Total: {customerData.total_customers}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerData.active_subscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Currently connected
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {revenueData.average_transaction.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Data Export */}
      <Tabs defaultValue="revenue-chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue-chart">Revenue Chart</TabsTrigger>
          <TabsTrigger value="plan-breakdown">Plan Breakdown</TabsTrigger>
          <TabsTrigger value="export">Data Export</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue-chart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan-breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip />
                    <RechartsPie 
                      data={planData} 
                      dataKey="revenue" 
                      nameKey="plan_name"
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80}
                    >
                      {planData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </RechartsPie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Plan Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planData.map((plan, index) => (
                    <div key={plan.plan_name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{plan.plan_name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">KES {plan.revenue.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {plan.customer_count} customers ({plan.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>
                Export data for the selected date range in various formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-semibold">Revenue Report</h4>
                  <p className="text-sm text-muted-foreground">All successful payments and transactions</p>
                  <div className="flex gap-2">
                    <CSVLink
                      data={exportData}
                      filename={`revenue-report-${dateRange.from}-to-${dateRange.to}.csv`}
                      onClick={() => generateCSVData('revenue')}
                    >
                      <Button variant="outline" size="sm" disabled={loading}>
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                    </CSVLink>
                    <Button variant="outline" size="sm" onClick={generatePDFReport} disabled={loading}>
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Customer Report</h4>
                  <p className="text-sm text-muted-foreground">Customer registrations and details</p>
                  <div className="flex gap-2">
                    <CSVLink
                      data={exportData}
                      filename={`customers-report-${dateRange.from}-to-${dateRange.to}.csv`}
                      onClick={() => generateCSVData('customers')}
                    >
                      <Button variant="outline" size="sm" disabled={loading}>
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                    </CSVLink>
                    <Button variant="outline" size="sm" onClick={generatePDFReport} disabled={loading}>
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Subscription Report</h4>
                  <p className="text-sm text-muted-foreground">All subscription details and statuses</p>
                  <div className="flex gap-2">
                    <CSVLink
                      data={exportData}
                      filename={`subscriptions-report-${dateRange.from}-to-${dateRange.to}.csv`}
                      onClick={() => generateCSVData('subscriptions')}
                    >
                      <Button variant="outline" size="sm" disabled={loading}>
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                    </CSVLink>
                    <Button variant="outline" size="sm" onClick={generatePDFReport} disabled={loading}>
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
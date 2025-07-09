
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Wifi, Download, Upload, Clock, TrendingUp } from 'lucide-react';

interface UsageStats {
  id: string;
  date: string;
  bytes_downloaded: number;
  bytes_uploaded: number;
  session_duration: number;
  peak_speed_mbps: number;
}

interface ConnectionInfo {
  id: string;
  ip_address: string;
  connection_start: string;
  status: string;
  bytes_downloaded: number;
  bytes_uploaded: number;
}

const UsageStatistics = () => {
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const fetchUsageData = async () => {
    try {
      setLoading(true);

      // Fetch usage statistics for the last 30 days
      const { data: stats, error: statsError } = await supabase
        .from('usage_statistics')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (statsError) throw statsError;

      // Fetch current connection info
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: connections, error: connError } = await supabase
          .from('user_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('connection_start', { ascending: false })
          .limit(1);

        if (connError) throw connError;
        
        if (connections && connections.length > 0) {
          setConnectionInfo(connections[0]);
        }
      }

      setUsageStats(stats || []);
    } catch (error) {
      console.error('Error fetching usage data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch usage statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();

    // Set up real-time subscription for usage updates
    const channel = supabase
      .channel('usage-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usage_statistics'
        },
        () => {
          fetchUsageData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_connections'
        },
        () => {
          fetchUsageData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-gray-200"></CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalDownload = usageStats.reduce((sum, stat) => sum + (stat.bytes_downloaded || 0), 0);
  const totalUpload = usageStats.reduce((sum, stat) => sum + (stat.bytes_uploaded || 0), 0);
  const totalDuration = usageStats.reduce((sum, stat) => sum + (stat.session_duration || 0), 0);
  const avgSpeed = usageStats.length > 0 
    ? usageStats.reduce((sum, stat) => sum + (stat.peak_speed_mbps || 0), 0) / usageStats.length 
    : 0;

  const chartData = usageStats.slice(0, 7).reverse().map(stat => ({
    date: new Date(stat.date).toLocaleDateString(),
    download: (stat.bytes_downloaded || 0) / (1024 * 1024 * 1024), // Convert to GB
    upload: (stat.bytes_uploaded || 0) / (1024 * 1024 * 1024),
    speed: stat.peak_speed_mbps || 0
  }));

  return (
    <div className="space-y-6">
      {/* Current Connection Status */}
      {connectionInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Current Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={connectionInfo.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                  {connectionInfo.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IP Address</p>
                <p className="font-mono text-sm">{connectionInfo.ip_address || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connected Since</p>
                <p className="text-sm">{new Date(connectionInfo.connection_start).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloaded</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalDownload)}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uploaded</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalUpload)}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalDuration)}</div>
            <p className="text-xs text-muted-foreground">Total online time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Speed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSpeed.toFixed(1)} Mbps</div>
            <p className="text-xs text-muted-foreground">Peak speeds</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Data Usage</TabsTrigger>
          <TabsTrigger value="speed">Speed History</TabsTrigger>
        </TabsList>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Daily Data Usage (Last 7 Days)</CardTitle>
              <CardDescription>Download and upload data in GB</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(2)} GB`, '']} />
                  <Bar dataKey="download" fill="#3b82f6" name="Download" />
                  <Bar dataKey="upload" fill="#10b981" name="Upload" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="speed">
          <Card>
            <CardHeader>
              <CardTitle>Speed History (Last 7 Days)</CardTitle>
              <CardDescription>Peak speeds recorded in Mbps</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value} Mbps`, 'Speed']} />
                  <Line 
                    type="monotone" 
                    dataKey="speed" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsageStatistics;

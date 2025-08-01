
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Download, 
  Upload, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Wifi, 
  AlertTriangle,
  BarChart3,
  Calendar,
  Zap,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

interface UsageData {
  totalData: number;
  usedData: number;
  remainingData: number;
  uploadSpeed: number;
  downloadSpeed: number;
  lastUpdated: string;
  isActive: boolean;
}

const UsageStatistics = () => {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchUsageData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setUsageData({
        totalData: 100, // GB
        usedData: 45.7,
        remainingData: 54.3,
        uploadSpeed: 12.5, // Mbps
        downloadSpeed: 85.2, // Mbps
        lastUpdated: new Date().toISOString(),
        isActive: true
      });
      setLoading(false);
    };

    fetchUsageData();
  }, [timeRange]);

  const getUsagePercentage = () => {
    if (!usageData) return 0;
    return (usageData.usedData / usageData.totalData) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'secondary';
    return 'default';
  };

  const formatData = (data: number) => {
    return `${data.toFixed(1)} GB`;
  };

  const formatSpeed = (speed: number) => {
    return `${speed.toFixed(1)} Mbps`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!usageData) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mb-6">
              <Activity className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No usage data available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Usage statistics will appear here once you have an active subscription and start using the internet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Activate Plan
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Usage Statistics</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your internet usage and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={timeRange === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('today')}
          >
            Today
          </Button>
          <Button
            variant={timeRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('week')}
          >
            Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('month')}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Connection Status Alert */}
      {!usageData.isActive && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  No active connection
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Usage data is not available when disconnected
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Data Usage */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Data Usage
              </CardTitle>
              <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatData(usageData.usedData)}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700 dark:text-blue-300">Used</span>
                  <span className="text-blue-900 dark:text-blue-100 font-medium">
                    {getUsagePercentage().toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage()} 
                  className="h-2"
                  
                />
                <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
                  <span>0 GB</span>
                  <span>{formatData(usageData.totalData)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Download Speed */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 dark:bg-green-800 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                Download Speed
              </CardTitle>
              <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatSpeed(usageData.downloadSpeed)}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 dark:text-green-300">
                  Active connection
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Speed */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 dark:bg-purple-800 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Upload Speed
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {formatSpeed(usageData.uploadSpeed)}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-purple-700 dark:text-purple-300">
                  Active connection
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Usage Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Usage Breakdown</CardTitle>
                <CardDescription>Detailed breakdown of your data consumption</CardDescription>
              </div>
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">Used Data</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatData(usageData.usedData)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {getUsagePercentage().toFixed(1)}% of total
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Remaining Data</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatData(usageData.remainingData)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {(100 - getUsagePercentage()).toFixed(1)}% of total
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="font-medium">Total Allocation</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatData(usageData.totalData)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Monthly limit
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Performance</CardTitle>
                <CardDescription>Real-time connection metrics</CardDescription>
              </div>
              <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Download Speed</span>
                  <Badge variant="default" className="text-xs">
                    {formatSpeed(usageData.downloadSpeed)}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((usageData.downloadSpeed / 100) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Upload Speed</span>
                  <Badge variant="default" className="text-xs">
                    {formatSpeed(usageData.uploadSpeed)}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((usageData.uploadSpeed / 50) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Last Updated</span>
                  <span className="font-medium">
                    {new Date(usageData.lastUpdated).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Tips */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center flex-shrink-0">
              <Wifi className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                Usage Tips
              </h4>
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                <li>• Monitor your usage to avoid exceeding your data limit</li>
                <li>• High-definition streaming uses more data than standard quality</li>
                <li>• Consider upgrading your plan if you frequently reach your limit</li>
                <li>• Contact support if you experience connection issues</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageStatistics;

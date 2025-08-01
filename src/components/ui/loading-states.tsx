
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Wifi, Zap } from 'lucide-react';

export const TableSkeleton = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48 bg-primary/10" />
      <Skeleton className="h-10 w-32 bg-accent/10" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="tech-card animate-pulse">
          <CardHeader>
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-32 bg-primary/20" />
              <Skeleton className="h-6 w-16 bg-accent/20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full bg-muted/30" />
            <Skeleton className="h-4 w-3/4 bg-muted/30" />
            <Skeleton className="h-4 w-1/2 bg-muted/30" />
            <div className="flex space-x-2 pt-2">
              <Skeleton className="h-8 w-20 bg-primary/10" />
              <Skeleton className="h-8 w-20 bg-accent/10" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="tech-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 bg-muted/30" />
                <Skeleton className="h-8 w-16 bg-primary/20" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full bg-accent/20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    <TableSkeleton />
  </div>
);

export const FullPageLoader = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-card/50 to-background" role="status" aria-live="polite">
    <div className="text-center space-y-6 glass-card p-8 max-w-sm">
      <div className="relative">
        <div className="absolute inset-0 animate-electric-pulse rounded-full"></div>
        <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary relative z-10" />
      </div>
      <div className="space-y-2">
        <p className="text-lg font-medium text-foreground">{message}</p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Wifi className="h-4 w-4 animate-pulse" />
          <span>Connecting to network...</span>
        </div>
      </div>
      {/* Tech progress indicator */}
      <div className="w-full bg-muted/30 rounded-full h-1 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-accent animate-pulse" style={{ width: '60%' }}></div>
      </div>
    </div>
  </div>
);

export const ComponentLoader = ({ size = "default", message }: { size?: "sm" | "default" | "lg"; message?: string }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8"
  };

  const containerClasses = {
    sm: "p-2",
    default: "p-4",
    lg: "p-6"
  };

  return (
    <div className={`flex items-center justify-center ${containerClasses[size]} tech-card`} role="status" aria-live="polite">
      <div className="text-center space-y-3">
        <div className="relative">
          <div className="absolute inset-0 animate-glow-pulse rounded-full opacity-50"></div>
          <Loader2 className={`${sizeClasses[size]} animate-spin mx-auto text-primary relative z-10`} />
        </div>
        {message && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 animate-pulse text-accent" />
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// New tech-themed loading component for plans
export const PlanLoader = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i} className="tech-card animate-pulse">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full bg-primary/20" />
              <Skeleton className="h-6 w-24 bg-primary/20" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full bg-accent/20" />
          </div>
          <Skeleton className="h-4 w-full bg-muted/20 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-20 bg-primary/30" />
            <Skeleton className="h-4 w-16 bg-muted/20" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5">
              <Skeleton className="h-4 w-4 bg-primary/20" />
              <Skeleton className="h-4 w-24 bg-primary/20" />
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/5">
              <Skeleton className="h-4 w-4 bg-accent/20" />
              <Skeleton className="h-4 w-28 bg-accent/20" />
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-xl bg-gradient-to-r from-primary/20 to-accent/20" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// Enhanced loading for network operations
export const NetworkLoader = ({ message = "Processing..." }: { message?: string }) => (
  <div className="flex items-center justify-center p-8" role="status" aria-live="polite">
    <div className="text-center space-y-4 tech-card p-6">
      <div className="relative w-16 h-16 mx-auto">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <Wifi className="absolute inset-0 m-auto h-6 w-6 text-accent animate-pulse" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{message}</p>
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div 
              key={i} 
              className="w-1 h-1 bg-primary rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

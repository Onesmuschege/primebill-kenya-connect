
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const TableSkeleton = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex space-x-2 pt-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
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
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    <TableSkeleton />
  </div>
);

export const FullPageLoader = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
    <div className="text-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

export const ComponentLoader = ({ size = "default", message }: { size?: "sm" | "default" | "lg"; message?: string }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <div className="flex items-center justify-center p-4" role="status" aria-live="polite">
      <div className="text-center space-y-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin mx-auto text-primary`} />
        {message && <p className="text-xs text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
};


import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useExport } from '@/hooks/useExport';

interface ExportButtonProps {
  data: any[];
  filename: string;
  headers: { label: string; key: string }[];
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename,
  headers,
  variant = 'outline',
  size = 'default',
  className = '',
}) => {
  const { exportToCSV, isExporting } = useExport();

  const handleExport = () => {
    exportToCSV({ data, filename, headers });
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || data.length === 0}
      variant={variant}
      size={size}
      className={className}
      aria-label={`Export ${filename} to CSV`}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="h-4 w-4 mr-2" aria-hidden="true" />
      )}
      Export CSV
    </Button>
  );
};

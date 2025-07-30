
import { useState } from 'react';
import { CSVLink } from 'react-csv';
import { useNotifications } from '@/hooks/useNotifications';

interface ExportData {
  data: any[];
  filename: string;
  headers: { label: string; key: string }[];
}

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { showSuccess, showError } = useNotifications();

  const exportToCSV = async (exportData: ExportData) => {
    try {
      setIsExporting(true);
      
      // Transform data if needed
      const transformedData = exportData.data.map(item => {
        const transformedItem: any = {};
        exportData.headers.forEach(header => {
          const value = getNestedValue(item, header.key);
          transformedItem[header.key] = value;
        });
        return transformedItem;
      });

      // Create CSV content
      const csvContent = [
        exportData.headers.map(h => h.label).join(','),
        ...transformedData.map(row => 
          exportData.headers.map(h => {
            const value = row[h.key];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${exportData.filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess('Export completed', `${exportData.filename}.csv has been downloaded`);
    } catch (error) {
      console.error('Export error:', error);
      showError('Export failed', 'There was an error exporting the data');
    } finally {
      setIsExporting(false);
    }
  };

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  };

  return {
    exportToCSV,
    isExporting,
  };
};

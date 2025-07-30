
import { useState, useMemo, useCallback } from 'react';

export interface UseSearchAndFilterOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  filterFunctions?: Record<string, (item: T, filterValue: string) => boolean>;
}

export function useSearchAndFilter<T>({
  data,
  searchFields,
  filterFunctions = {}
}: UseSearchAndFilterOptions<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply custom filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && filterFunctions[key]) {
        filtered = filtered.filter(item => filterFunctions[key](item, value));
      }
    });

    return filtered;
  }, [data, searchTerm, filters, searchFields, filterFunctions]);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setFilters({});
  }, []);

  return {
    searchTerm,
    filters,
    filteredData,
    handleSearchChange,
    handleFilterChange,
    clearAllFilters
  };
}

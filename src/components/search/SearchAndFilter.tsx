
import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface FilterOption {
  key: string;
  label: string;
  value: string;
}

export interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  filterOptions: Record<string, FilterOption[]>;
  placeholder?: string;
  className?: string;
}

export const SearchAndFilter = React.memo(({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  filterOptions,
  placeholder = "Search...",
  className = ""
}: SearchAndFilterProps) => {
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value && value !== 'all').length;
  }, [filters]);

  const clearFilter = (key: string) => {
    onFilterChange(key, '');
  };

  const clearAllFilters = () => {
    Object.keys(filters).forEach(key => {
      onFilterChange(key, '');
    });
    onSearchChange('');
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <h4 className="font-medium">Filter Options</h4>
              
              {Object.entries(filterOptions).map(([key, options]) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <Select
                    value={filters[key] || ''}
                    onValueChange={(value) => onFilterChange(key, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${key}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(filters).map(([key, value]) => {
              if (!value || value === 'all') return null;
              
              const option = filterOptions[key]?.find(opt => opt.value === value);
              if (!option) return null;

              return (
                <Badge key={key} variant="secondary" className="flex items-center gap-1">
                  {option.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => clearFilter(key)}
                  />
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

SearchAndFilter.displayName = 'SearchAndFilter';

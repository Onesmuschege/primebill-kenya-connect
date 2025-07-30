
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Filter } from 'lucide-react';

interface SearchFilter {
  key: string;
  label: string;
  value: string;
}

interface AdvancedSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: SearchFilter[];
  onFilterAdd: (filter: SearchFilter) => void;
  onFilterRemove: (filterKey: string) => void;
  filterOptions: Record<string, { key: string; label: string; value: string }[]>;
  placeholder?: string;
  className?: string;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterAdd,
  onFilterRemove,
  filterOptions,
  placeholder = "Search...",
  className = ""
}) => {
  const [selectedFilterType, setSelectedFilterType] = React.useState<string>('');
  const [selectedFilterValue, setSelectedFilterValue] = React.useState<string>('');

  const handleAddFilter = () => {
    if (selectedFilterType && selectedFilterValue) {
      const filterOption = filterOptions[selectedFilterType]?.find(
        option => option.value === selectedFilterValue
      );
      
      if (filterOption) {
        onFilterAdd({
          key: selectedFilterType,
          label: filterOption.label,
          value: selectedFilterValue
        });
        setSelectedFilterType('');
        setSelectedFilterValue('');
      }
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={selectedFilterType} onValueChange={setSelectedFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(filterOptions).map(([key, options]) => (
                <SelectItem key={key} value={key}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedFilterType && (
            <Select value={selectedFilterValue} onValueChange={setSelectedFilterValue}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select value..." />
              </SelectTrigger>
              <SelectContent>
                {filterOptions[selectedFilterType]?.map((option) => (
                  <SelectItem key={option.key} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={handleAddFilter}
            disabled={!selectedFilterType || !selectedFilterValue}
            size="sm"
            variant="outline"
          >
            <Filter className="h-4 w-4 mr-1" />
            Add Filter
          </Button>
        </div>

        {/* Active Filters */}
        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Badge key={`${filter.key}-${filter.value}`} variant="secondary" className="px-3 py-1">
                {filter.label}
                <button
                  onClick={() => onFilterRemove(filter.key)}
                  className="ml-2 hover:text-red-600"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

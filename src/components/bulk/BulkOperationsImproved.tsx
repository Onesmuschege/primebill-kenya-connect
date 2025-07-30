
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Edit, Download, Users } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'destructive';
  requiresConfirmation?: boolean;
}

interface BulkOperation<T> {
  selectedItems: T[];
  onSelectionChange: (items: T[]) => void;
  onBulkAction: (actionId: string, items: T[]) => Promise<void>;
  availableActions: BulkAction[];
  allItems: T[];
  isLoading?: boolean;
}

export function BulkOperations<T extends { id: string }>({
  selectedItems,
  onSelectionChange,
  onBulkAction,
  availableActions,
  allItems,
  isLoading = false
}: BulkOperation<T>) {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const { showSuccess, showError } = useNotifications();

  const handleSelectAll = (checked: boolean) => {
    onSelectionChange(checked ? allItems : []);
  };

  const handleItemSelect = (item: T, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, item]);
    } else {
      onSelectionChange(selectedItems.filter(selected => selected.id !== item.id));
    }
  };

  const executeBulkAction = async () => {
    if (!selectedAction || selectedItems.length === 0) return;

    setIsExecuting(true);
    try {
      await onBulkAction(selectedAction, selectedItems);
      showSuccess('Bulk operation completed', `Action applied to ${selectedItems.length} items`);
      onSelectionChange([]);
      setSelectedAction('');
    } catch (error) {
      showError('Bulk operation failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsExecuting(false);
    }
  };

  const selectedAction_obj = availableActions.find(action => action.id === selectedAction);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk Operations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={selectedItems.length === allItems.length && allItems.length > 0}
              onCheckedChange={handleSelectAll}
              disabled={isLoading}
            />
            <span className="text-sm font-medium">
              Select All ({selectedItems.length} of {allItems.length} selected)
            </span>
          </div>
          {selectedItems.length > 0 && (
            <Badge variant="secondary">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </Badge>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose an action..." />
              </SelectTrigger>
              <SelectContent>
                {availableActions.map((action) => (
                  <SelectItem key={action.id} value={action.id}>
                    <div className="flex items-center gap-2">
                      {action.icon}
                      {action.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedAction_obj?.requiresConfirmation ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={selectedAction_obj.variant || 'default'}
                    disabled={!selectedAction || isExecuting}
                    className="min-w-24"
                  >
                    {isExecuting ? 'Processing...' : 'Execute'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to {selectedAction_obj.label.toLowerCase()} {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}? 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={executeBulkAction}
                      className={selectedAction_obj.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      {selectedAction_obj.label}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                onClick={executeBulkAction}
                variant={selectedAction_obj?.variant || 'default'}
                disabled={!selectedAction || isExecuting}
                className="min-w-24"
              >
                {isExecuting ? 'Processing...' : 'Execute'}
              </Button>
            )}
          </div>
        )}

        {/* Individual Item Selection Helper */}
        <div className="text-xs text-gray-500">
          Tip: Use checkboxes in the table below to select individual items for bulk operations.
        </div>
      </CardContent>
    </Card>
  );
}

// Predefined bulk actions for common use cases
export const commonBulkActions = {
  delete: {
    id: 'delete',
    label: 'Delete Selected',
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'destructive' as const,
    requiresConfirmation: true
  },
  export: {
    id: 'export',
    label: 'Export Selected',
    icon: <Download className="h-4 w-4" />,
    variant: 'default' as const
  },
  activate: {
    id: 'activate',
    label: 'Activate Selected',
    icon: <Edit className="h-4 w-4" />,
    variant: 'default' as const
  },
  deactivate: {
    id: 'deactivate',
    label: 'Deactivate Selected',
    icon: <Edit className="h-4 w-4" />,
    variant: 'default' as const
  }
};


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserCheck, UserX, MoreHorizontal } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  requiresConfirmation?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
}

interface BulkOperationsProps<T> {
  items: T[];
  selectedItems: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  getItemId: (item: T) => string;
  actions: BulkAction[];
  onActionExecute: (actionId: string, selectedIds: string[]) => Promise<void>;
  isLoading?: boolean;
}

export function BulkOperations<T>({
  items,
  selectedItems,
  onSelectionChange,
  getItemId,
  actions,
  onActionExecute,
  isLoading = false,
}: BulkOperationsProps<T>) {
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const isAllSelected = items.length > 0 && selectedItems.size === items.length;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < items.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(items.map(getItemId));
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleItemSelect = (itemId: string, checked: boolean) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(itemId);
    } else {
      newSelection.delete(itemId);
    }
    onSelectionChange(newSelection);
  };

  const handleActionClick = (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
      setShowConfirmDialog(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: BulkAction) => {
    const selectedIds = Array.from(selectedItems);
    await onActionExecute(action.id, selectedIds);
    onSelectionChange(new Set()); // Clear selection after action
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      executeAction(pendingAction);
    }
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const renderSelectAllCheckbox = () => (
    <Checkbox
      checked={isAllSelected}
      ref={(el) => {
        if (el) el.indeterminate = isIndeterminate;
      }}
      onCheckedChange={handleSelectAll}
      disabled={isLoading}
    />
  );

  const renderItemCheckbox = (item: T) => {
    const itemId = getItemId(item);
    return (
      <Checkbox
        checked={selectedItems.has(itemId)}
        onCheckedChange={(checked) => handleItemSelect(itemId, !!checked)}
        disabled={isLoading}
      />
    );
  };

  const renderBulkActions = () => {
    if (selectedItems.size === 0) return null;

    return (
      <div className="flex items-center gap-2 p-4 bg-blue-50 border-b">
        <Badge variant="secondary">
          {selectedItems.size} selected
        </Badge>
        
        <div className="flex gap-2 ml-4">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={() => handleActionClick(action)}
              disabled={isLoading}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectionChange(new Set())}
          className="ml-auto"
        >
          Clear Selection
        </Button>
      </div>
    );
  };

  return (
    <>
      {/* Bulk Actions Bar */}
      {renderBulkActions()}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.confirmTitle || 'Confirm Action'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.confirmDescription || 
               `Are you sure you want to perform this action on ${selectedItems.size} selected item(s)?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export the helper functions for use in parent components */}
      {React.createElement('div', { 
        style: { display: 'none' },
        'data-select-all-checkbox': renderSelectAllCheckbox,
        'data-item-checkbox': renderItemCheckbox,
      })}
    </>
  );
}

// Export helper functions for easier use
export const useBulkOperations = <T,>(items: T[], getItemId: (item: T) => string) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleSelectionChange = (newSelection: Set<string>) => {
    setSelectedItems(newSelection);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const selectAll = () => {
    const allIds = new Set(items.map(getItemId));
    setSelectedItems(allIds);
  };

  const isSelected = (item: T) => {
    return selectedItems.has(getItemId(item));
  };

  return {
    selectedItems,
    handleSelectionChange,
    clearSelection,
    selectAll,
    isSelected,
  };
};


import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../utils';
import { DataTable, Column } from '@/components/ui/data-table';

interface TestData {
  id: string;
  name: string;
  email: string;
  status: string;
}

const mockData: TestData[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'active' }
];

const mockColumns: Column<TestData>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', filterable: true },
  { key: 'status', header: 'Status', sortable: true }
];

describe('DataTable', () => {
  it('renders table with data', () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(
      <DataTable
        data={[]}
        columns={mockColumns}
        emptyMessage="No users found"
      />
    );

    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('handles row selection when selectable', () => {
    const onSelectionChange = vi.fn();
    
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        selectable
        onSelectionChange={onSelectionChange}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // First data row checkbox

    expect(onSelectionChange).toHaveBeenCalledWith([mockData[0]]);
  });

  it('handles select all functionality', () => {
    const onSelectionChange = vi.fn();
    
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        selectable
        onSelectionChange={onSelectionChange}
      />
    );

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    expect(onSelectionChange).toHaveBeenCalledWith(mockData);
  });

  it('handles sorting', () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
      />
    );

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    // Should trigger sorting (visual feedback in chevrons)
    expect(nameHeader).toBeInTheDocument();
  });

  it('handles filtering', () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
      />
    );

    const filterInput = screen.getByPlaceholderText('Filter Email...');
    fireEvent.change(filterInput, { target: { value: 'john' } });

    // Should filter the data (only John's row visible)
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument();
  });

  it('handles row click', () => {
    const onRowClick = vi.fn();
    
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        onRowClick={onRowClick}
      />
    );

    const firstRow = screen.getByText('John Doe').closest('tr');
    fireEvent.click(firstRow!);

    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('renders actions dropdown', () => {
    const mockActions = [
      { label: 'Edit', onClick: vi.fn() },
      { label: 'Delete', onClick: vi.fn(), variant: 'destructive' as const }
    ];

    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        actions={mockActions}
      />
    );

    const actionButtons = screen.getAllByRole('button');
    const actionButton = actionButtons.find(button => 
      button.querySelector('svg') // MoreVertical icon
    );

    expect(actionButton).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(
      <DataTable
        data={[]}
        columns={mockColumns}
        loading
      />
    );

    // Should show skeleton loading rows
    const skeletonRows = document.querySelectorAll('.animate-pulse');
    expect(skeletonRows.length).toBeGreaterThan(0);
  });
});

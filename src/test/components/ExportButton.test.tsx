
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from '@/components/export/ExportButton';

// Mock the useExport hook
vi.mock('@/hooks/useExport', () => ({
  useExport: () => ({
    exportToCSV: vi.fn(),
    isExporting: false,
  }),
}));

describe('ExportButton', () => {
  const mockData = [
    { id: 1, name: 'Test User', email: 'test@example.com' },
    { id: 2, name: 'Another User', email: 'another@example.com' },
  ];

  const mockHeaders = [
    { label: 'ID', key: 'id' },
    { label: 'Name', key: 'name' },
    { label: 'Email', key: 'email' },
  ];

  it('renders export button', () => {
    render(
      <ExportButton
        data={mockData}
        filename="test-export"
        headers={mockHeaders}
      />
    );

    expect(screen.getByRole('button', { name: /export test-export to csv/i })).toBeInTheDocument();
  });

  it('disables button when no data', () => {
    render(
      <ExportButton
        data={[]}
        filename="test-export"
        headers={mockHeaders}
      />
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state', () => {
    vi.mock('@/hooks/useExport', () => ({
      useExport: () => ({
        exportToCSV: vi.fn(),
        isExporting: true,
      }),
    }));

    render(
      <ExportButton
        data={mockData}
        filename="test-export"
        headers={mockHeaders}
      />
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });
});

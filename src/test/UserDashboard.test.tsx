
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from './utils';
import UserDashboard from '@/components/UserDashboard';

// Mock the hooks and components
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        }
      })
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'test-user-id',
              name: 'Test User',
              email: 'test@example.com',
              phone: '+254700000000'
            }
          })
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null })
          }))
        }))
      }))
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn()
      }))
    })),
    removeChannel: vi.fn()
  }
}));

describe('UserDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<UserDashboard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders dashboard content after loading', async () => {
    render(<UserDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Manage your internet subscription')).toBeInTheDocument();
  });

  it('displays tabs correctly', async () => {
    render(<UserDashboard />);
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /usage/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /plans/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /payments/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /history/i })).toBeInTheDocument();
    });
  });

  it('handles tab switching', async () => {
    render(<UserDashboard />);
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /plans/i })).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('tab', { name: /plans/i }));
    
    await waitFor(() => {
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    render(<UserDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Refresh'));
    
    // Should show refreshing state briefly
    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
  });
});

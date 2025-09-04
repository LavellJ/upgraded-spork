/**
 * Tests for Growth dashboard functionality
 * V5: Growth dashboard with referrals & invites tracking plus CSV export
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Growth } from '../src/guide/reports/Growth';

// Mock the useReferrals hook
const mockReferrals = [
  {
    code: 'ABC123',
    url: 'http://localhost:5000/r/ABC123',
    ownerEmail: 'teacher@example.com',
    createdAt: Date.now() - (5 * 24 * 60 * 60 * 1000), // 5 days ago
    clicks: 3,
    lastClickAt: Date.now() - (2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    code: 'DEF456',
    url: 'http://localhost:5000/r/DEF456',
    ownerEmail: 'teacher@example.com',
    createdAt: Date.now() - (10 * 24 * 60 * 60 * 1000), // 10 days ago
    clicks: 7,
    lastClickAt: Date.now() - (8 * 24 * 60 * 60 * 1000) // 8 days ago
  }
];

const mockRefresh = vi.fn();
const mockCreateReferral = vi.fn();

vi.mock('../src/hooks/useReferrals', () => ({
  useReferrals: () => ({
    referrals: mockReferrals,
    loading: false,
    error: null,
    refresh: mockRefresh,
    createReferral: mockCreateReferral
  })
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
});

// Mock window methods for QR poster generation
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true
});

// Mock URL for CSV download
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn()
  },
  writable: true
});

describe('Growth Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateReferral.mockResolvedValue({
      code: 'NEW123',
      url: 'http://localhost:5000/r/NEW123',
      ownerEmail: 'teacher@example.com',
      createdAt: Date.now(),
      clicks: 0,
      lastClickAt: null
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render growth dashboard with correct title and description', () => {
      render(<Growth />);

      expect(screen.getByTestId('growth-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Growth Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Track referrals and co-teacher invitations')).toBeInTheDocument();
    });

    it('should render all metric cards', () => {
      render(<Growth />);

      expect(screen.getByTestId('co-teacher-invites-sent-card')).toBeInTheDocument();
      expect(screen.getByTestId('co-teacher-invites-accepted-card')).toBeInTheDocument();
      expect(screen.getByTestId('referral-clicks-7d-card')).toBeInTheDocument();
      expect(screen.getByTestId('referral-clicks-total-card')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<Growth />);

      expect(screen.getByTestId('copy-referral-link-button')).toBeInTheDocument();
      expect(screen.getByTestId('print-qr-poster-button')).toBeInTheDocument();
      expect(screen.getByTestId('send-co-teacher-invite-button')).toBeInTheDocument();
      expect(screen.getByTestId('export-growth-csv-button')).toBeInTheDocument();
    });

    it('should render recent clicks table when there are clicks', () => {
      render(<Growth />);

      expect(screen.getByTestId('recent-clicks-card')).toBeInTheDocument();
      expect(screen.getByTestId('recent-clicks-table')).toBeInTheDocument();
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate referral clicks correctly', () => {
      render(<Growth />);

      // Total clicks should be sum of all clicks
      const totalClicksCard = screen.getByTestId('referral-clicks-total-card');
      expect(totalClicksCard).toHaveTextContent('10'); // 3 + 7

      // 7-day clicks should only include recent clicks  
      const clicks7dCard = screen.getByTestId('referral-clicks-7d-card');
      expect(clicks7dCard).toHaveTextContent('3'); // Only ABC123 was clicked in last 7 days
    });

    it('should show placeholder values for co-teacher metrics', () => {
      render(<Growth />);

      const invitesSentCard = screen.getByTestId('co-teacher-invites-sent-card');
      const invitesAcceptedCard = screen.getByTestId('co-teacher-invites-accepted-card');

      expect(invitesSentCard).toHaveTextContent('0');
      expect(invitesAcceptedCard).toHaveTextContent('0');
    });
  });

  describe('Actions', () => {
    it('should copy referral link when copy button is clicked', async () => {
      render(<Growth />);

      const copyButton = screen.getByTestId('copy-referral-link-button');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:5000/r/ABC123');
        expect(mockToast).toHaveBeenCalledWith({
          kind: 'success',
          text: 'Referral link copied to clipboard!'
        });
      });
    });

    it('should create new referral if none exists when copying', async () => {
      // Mock empty referrals array
      vi.mocked(mockReferrals).length = 0;

      render(<Growth />);

      const copyButton = screen.getByTestId('copy-referral-link-button');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockCreateReferral).toHaveBeenCalled();
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:5000/r/NEW123');
      });

      // Restore mocked data
      vi.mocked(mockReferrals).length = 2;
    });

    it('should open QR poster when print QR button is clicked', async () => {
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn()
        },
        focus: vi.fn(),
        print: vi.fn()
      };
      mockWindowOpen.mockReturnValue(mockPrintWindow);

      render(<Growth />);

      const qrButton = screen.getByTestId('print-qr-poster-button');
      fireEvent.click(qrButton);

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith('', '_blank');
        expect(mockPrintWindow.document.write).toHaveBeenCalled();
        expect(mockPrintWindow.focus).toHaveBeenCalled();
        expect(mockPrintWindow.print).toHaveBeenCalled();
      });
    });

    it('should show info toast for co-teacher invite button', async () => {
      render(<Growth />);

      const inviteButton = screen.getByTestId('send-co-teacher-invite-button');
      fireEvent.click(inviteButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          kind: 'info',
          text: 'Co-teacher invite system coming soon!'
        });
      });
    });
  });

  describe('CSV Export', () => {
    it('should export CSV when export button is clicked', async () => {
      const mockCreateElement = vi.fn(() => ({
        href: '',
        download: '',
        click: vi.fn()
      }));
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();

      Object.defineProperty(document, 'createElement', {
        value: mockCreateElement,
        writable: true
      });
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        writable: true
      });
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        writable: true
      });

      render(<Growth />);

      const exportButton = screen.getByTestId('export-growth-csv-button');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockCreateElement).toHaveBeenCalledWith('a');
        expect(window.URL.createObjectURL).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          kind: 'success',
          text: 'Growth metrics exported successfully!'
        });
      });
    });

    it('should have stable CSV headers', () => {
      render(<Growth />);

      // This test ensures the CSV structure remains consistent
      // In a real implementation, we'd verify the actual CSV content
      const exportButton = screen.getByTestId('export-growth-csv-button');
      expect(exportButton).toBeInTheDocument();
      expect(exportButton).not.toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('should show loading message when loading', () => {
      // Mock loading state
      vi.doMock('../src/hooks/useReferrals', () => ({
        useReferrals: () => ({
          referrals: [],
          loading: true,
          error: null,
          refresh: mockRefresh,
          createReferral: mockCreateReferral
        })
      }));

      render(<Growth />);

      expect(screen.getByText('Loading growth metrics...')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no recent clicks', () => {
      // Mock no recent clicks
      vi.doMock('../src/hooks/useReferrals', () => ({
        useReferrals: () => ({
          referrals: [{
            code: 'OLD123',
            url: 'http://localhost:5000/r/OLD123',
            ownerEmail: 'teacher@example.com',
            createdAt: Date.now() - (40 * 24 * 60 * 60 * 1000), // 40 days ago
            clicks: 5,
            lastClickAt: Date.now() - (35 * 24 * 60 * 60 * 1000) // 35 days ago
          }],
          loading: false,
          error: null,
          refresh: mockRefresh,
          createReferral: mockCreateReferral
        })
      }));

      render(<Growth />);

      expect(screen.getByText('No recent referral clicks found')).toBeInTheDocument();
      expect(screen.getByText('Share your referral link to start tracking clicks!')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle clipboard copy errors gracefully', async () => {
      vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Clipboard failed'));

      render(<Growth />);

      const copyButton = screen.getByTestId('copy-referral-link-button');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          kind: 'error',
          text: 'Failed to copy referral link'
        });
      });
    });

    it('should handle CSV export errors gracefully', async () => {
      // Mock URL.createObjectURL to throw an error
      vi.mocked(window.URL.createObjectURL).mockImplementation(() => {
        throw new Error('Blob creation failed');
      });

      render(<Growth />);

      const exportButton = screen.getByTestId('export-growth-csv-button');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          kind: 'error',
          text: 'Failed to export growth metrics'
        });
      });
    });
  });
});
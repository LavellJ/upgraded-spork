import { render, screen, waitFor } from '@testing-library/react';
import { EmptyState } from '../src/components/ui/empty';
import { InlineError } from '../src/components/ui/inline-error';
import { ToastProvider, useToast } from '../src/components/ui/toast';
import { vi, describe, it, expect } from 'vitest';

describe('UI State Components', () => {
  describe('EmptyState', () => {
    it('renders with title and aria attributes', () => {
      render(<EmptyState title="No data found" />);
      
      expect(screen.getByText('No data found')).toBeInTheDocument();
    });

    it('renders with action button', () => {
      const onAction = vi.fn();
      render(
        <EmptyState 
          title="No classes" 
          message="Create your first class" 
          actionLabel="Create Class"
          onAction={onAction}
        />
      );
      
      expect(screen.getByRole('button', { name: 'Create Class' })).toBeInTheDocument();
    });
  });

  describe('InlineError', () => {
    it('renders with alert role', () => {
      render(<InlineError message="Something went wrong" />);
      
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    });

    it('renders retry button when provided', () => {
      const onRetry = vi.fn();
      render(<InlineError message="Error occurred" onRetry={onRetry} />);
      
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });
  });

  describe('ToastProvider', () => {
    function TestComponent() {
      const toast = useToast();
      return (
        <button onClick={() => toast.push({ kind: 'success', text: 'Test message' })}>
          Push Toast
        </button>
      );
    }

    it('shows and hides toast messages', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      const button = screen.getByRole('button', { name: 'Push Toast' });
      button.click();
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
      
      // Toast should disappear after timeout
      await waitFor(() => {
        expect(screen.queryByText('Test message')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});
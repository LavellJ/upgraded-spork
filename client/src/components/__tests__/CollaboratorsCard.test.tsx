import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollaboratorsCard } from '../CollaboratorsCard';
import { useCollaborators } from '../../hooks/useCollaborators';
import { useToast } from '../../hooks/use-toast';

// Mock dependencies
jest.mock('../../hooks/useCollaborators');
jest.mock('../../hooks/use-toast');

// Mock fetch
global.fetch = jest.fn();

const mockUseCollaborators = useCollaborators as jest.MockedFunction<typeof useCollaborators>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('CollaboratorsCard', () => {
  const mockToast = jest.fn();
  const mockAdd = jest.fn();
  const mockRemove = jest.fn();
  const mockRefresh = jest.fn();

  const defaultProps = {
    classId: 'class-123',
    currentUserEmail: 'owner@school.edu',
    isOwner: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseToast.mockReturnValue({ toast: mockToast });
    mockLocalStorage.getItem.mockReturnValue('mock-auth-token');
    
    mockUseCollaborators.mockReturnValue({
      collaborators: [
        { email: 'owner@school.edu', role: 'owner', addedAt: Date.now() },
        { email: 'teacher1@school.edu', role: 'co_teacher', addedAt: Date.now() }
      ],
      loading: false,
      error: null,
      add: mockAdd,
      remove: mockRemove,
      refresh: mockRefresh
    });
  });

  describe('Invite Co-teacher functionality', () => {
    it('should render invite co-teacher button for owners', () => {
      render(<CollaboratorsCard {...defaultProps} />);
      
      expect(screen.getByTestId('button-invite-co-teacher')).toBeInTheDocument();
      expect(screen.getByText('Invite Co-teacher')).toBeInTheDocument();
    });

    it('should not render invite button for non-owners', () => {
      render(<CollaboratorsCard {...defaultProps} isOwner={false} />);
      
      expect(screen.queryByTestId('button-invite-co-teacher')).not.toBeInTheDocument();
    });

    it('should show invite form when invite button is clicked', async () => {
      const user = userEvent.setup();
      render(<CollaboratorsCard {...defaultProps} />);
      
      await user.click(screen.getByTestId('button-invite-co-teacher'));
      
      expect(screen.getByTestId('input-invite-email')).toBeInTheDocument();
      expect(screen.getByTestId('button-send-invite')).toBeInTheDocument();
      expect(screen.getByText('Send an email invitation to join this class as a co-teacher')).toBeInTheDocument();
    });

    it('should validate email format before sending invite', async () => {
      const user = userEvent.setup();
      render(<CollaboratorsCard {...defaultProps} />);
      
      await user.click(screen.getByTestId('button-invite-co-teacher'));
      await user.type(screen.getByTestId('input-invite-email'), 'invalid-email');
      await user.click(screen.getByTestId('button-send-invite'));
      
      expect(mockToast).toHaveBeenCalledWith({
        kind: 'error',
        text: 'Please enter a valid email address'
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should check for existing collaborators before sending invite', async () => {
      const user = userEvent.setup();
      render(<CollaboratorsCard {...defaultProps} />);
      
      await user.click(screen.getByTestId('button-invite-co-teacher'));
      await user.type(screen.getByTestId('input-invite-email'), 'teacher1@school.edu');
      await user.click(screen.getByTestId('button-send-invite'));
      
      expect(mockToast).toHaveBeenCalledWith({
        kind: 'error',
        text: 'This user is already a collaborator on this class'
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should send invite successfully for valid email', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          invitedEmail: 'newteacher@school.edu'
        })
      } as Response);
      
      render(<CollaboratorsCard {...defaultProps} />);
      
      await user.click(screen.getByTestId('button-invite-co-teacher'));
      await user.type(screen.getByTestId('input-invite-email'), 'newteacher@school.edu');
      await user.click(screen.getByTestId('button-send-invite'));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/invite/co-teacher', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-auth-token'
          },
          body: JSON.stringify({
            classId: 'class-123',
            email: 'newteacher@school.edu'
          })
        });
      });
      
      expect(mockToast).toHaveBeenCalledWith({
        kind: 'success',
        text: 'Invitation sent to newteacher@school.edu! They will receive an email with a link to join the class.'
      });
    });

    it('should handle invite sending errors', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Rate limit exceeded'
        })
      } as Response);
      
      render(<CollaboratorsCard {...defaultProps} />);
      
      await user.click(screen.getByTestId('button-invite-co-teacher'));
      await user.type(screen.getByTestId('input-invite-email'), 'newteacher@school.edu');
      await user.click(screen.getByTestId('button-send-invite'));
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          kind: 'error',
          text: 'Rate limit exceeded'
        });
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<CollaboratorsCard {...defaultProps} />);
      
      await user.click(screen.getByTestId('button-invite-co-teacher'));
      await user.type(screen.getByTestId('input-invite-email'), 'newteacher@school.edu');
      await user.click(screen.getByTestId('button-send-invite'));
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          kind: 'error',
          text: 'Failed to send invitation. Please try again.'
        });
      });
    });

    it('should cancel invite form and reset state', async () => {
      const user = userEvent.setup();
      render(<CollaboratorsCard {...defaultProps} />);
      
      await user.click(screen.getByTestId('button-invite-co-teacher'));
      await user.type(screen.getByTestId('input-invite-email'), 'test@example.com');
      await user.click(screen.getByTestId('button-cancel-invite'));
      
      expect(screen.queryByTestId('input-invite-email')).not.toBeInTheDocument();
      expect(screen.getByTestId('button-invite-co-teacher')).toBeInTheDocument();
    });

    it('should support keyboard shortcuts for invite form', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          invitedEmail: 'newteacher@school.edu'
        })
      } as Response);
      
      render(<CollaboratorsCard {...defaultProps} />);
      
      await user.click(screen.getByTestId('button-invite-co-teacher'));
      const emailInput = screen.getByTestId('input-invite-email');
      await user.type(emailInput, 'newteacher@school.edu');
      await user.type(emailInput, '{enter}');
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should escape to cancel invite form', async () => {
      const user = userEvent.setup();
      render(<CollaboratorsCard {...defaultProps} />);
      
      await user.click(screen.getByTestId('button-invite-co-teacher'));
      const emailInput = screen.getByTestId('input-invite-email');
      await user.type(emailInput, 'test@example.com');
      await user.type(emailInput, '{escape}');
      
      expect(screen.queryByTestId('input-invite-email')).not.toBeInTheDocument();
    });
  });

  describe('Form states', () => {
    it('should show both invite and add buttons initially', () => {
      render(<CollaboratorsCard {...defaultProps} />);
      
      expect(screen.getByTestId('button-invite-co-teacher')).toBeInTheDocument();
      expect(screen.getByTestId('button-add-collaborator')).toBeInTheDocument();
    });

    it('should hide other forms when invite form is open', async () => {
      const user = userEvent.setup();
      render(<CollaboratorsCard {...defaultProps} />);
      
      await user.click(screen.getByTestId('button-invite-co-teacher'));
      
      expect(screen.queryByTestId('button-add-collaborator')).not.toBeInTheDocument();
      expect(screen.getByTestId('input-invite-email')).toBeInTheDocument();
    });

    it('should hide other forms when add form is open', async () => {
      const user = userEvent.setup();
      render(<CollaboratorsCard {...defaultProps} />);
      
      await user.click(screen.getByTestId('button-add-collaborator'));
      
      expect(screen.queryByTestId('button-invite-co-teacher')).not.toBeInTheDocument();
      expect(screen.getByTestId('input-collaborator-email')).toBeInTheDocument();
    });
  });

  describe('Loading and error states', () => {
    it('should show loading state', () => {
      mockUseCollaborators.mockReturnValue({
        collaborators: [],
        loading: true,
        error: null,
        add: mockAdd,
        remove: mockRemove,
        refresh: mockRefresh
      });
      
      render(<CollaboratorsCard {...defaultProps} />);
      
      expect(screen.getByText('Loading collaborators...')).toBeInTheDocument();
    });

    it('should show disabled state while sending invite', async () => {
      const user = userEvent.setup();
      
      // Mock a slow response
      mockFetch.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, invitedEmail: 'test@example.com' })
        } as Response), 100)
      ));
      
      render(<CollaboratorsCard {...defaultProps} />);
      
      await user.click(screen.getByTestId('button-invite-co-teacher'));
      await user.type(screen.getByTestId('input-invite-email'), 'test@example.com');
      
      const sendButton = screen.getByTestId('button-send-invite');
      user.click(sendButton);
      
      expect(sendButton).toHaveTextContent('Sending...');
      expect(sendButton).toBeDisabled();
    });
  });
});
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CollaboratorsCard } from '../src/components/CollaboratorsCard';
import { useCollaborators } from '../src/hooks/useCollaborators';
import { useToast } from '../src/hooks/use-toast';

// Mock the hooks
vi.mock('../src/hooks/useCollaborators');
vi.mock('../src/hooks/use-toast');

const mockUseCollaborators = vi.mocked(useCollaborators);
const mockUseToast = vi.mocked(useToast);

describe('CollaboratorsCard', () => {
  const mockToast = vi.fn();
  const mockAdd = vi.fn();
  const mockRemove = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseToast.mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: []
    });

    mockUseCollaborators.mockReturnValue({
      collaborators: [],
      loading: false,
      error: null,
      add: mockAdd,
      remove: mockRemove,
      refresh: mockRefresh
    });
  });

  it('renders with no collaborators', () => {
    render(
      <CollaboratorsCard 
        classId="test-class-1" 
        currentUserEmail="teacher@school.edu"
        isOwner={true}
      />
    );

    expect(screen.getByText('Collaborators')).toBeInTheDocument();
    expect(screen.getByText('No collaborators yet')).toBeInTheDocument();
    expect(screen.getByTestId('button-add-collaborator')).toBeInTheDocument();
  });

  it('renders existing collaborators', () => {
    const mockCollaborators = [
      {
        classId: 'test-class-1',
        email: 'co-teacher@school.edu',
        role: 'co_teacher' as const,
        addedAt: Date.now()
      },
      {
        classId: 'test-class-1',
        email: 'viewer@school.edu',
        role: 'viewer' as const,
        addedAt: Date.now()
      }
    ];

    mockUseCollaborators.mockReturnValue({
      collaborators: mockCollaborators,
      loading: false,
      error: null,
      add: mockAdd,
      remove: mockRemove,
      refresh: mockRefresh
    });

    render(
      <CollaboratorsCard 
        classId="test-class-1" 
        currentUserEmail="teacher@school.edu"
        isOwner={true}
      />
    );

    expect(screen.getByTestId('collaborator-co-teacher@school.edu')).toBeInTheDocument();
    expect(screen.getByTestId('collaborator-viewer@school.edu')).toBeInTheDocument();
    expect(screen.getByText('Co-teacher')).toBeInTheDocument();
    expect(screen.getByText('Viewer')).toBeInTheDocument();
  });

  it('shows add collaborator form when owner clicks add button', async () => {
    render(
      <CollaboratorsCard 
        classId="test-class-1" 
        currentUserEmail="teacher@school.edu"
        isOwner={true}
      />
    );

    const addButton = screen.getByTestId('button-add-collaborator');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('input-collaborator-email')).toBeInTheDocument();
      expect(screen.getByTestId('select-collaborator-role')).toBeInTheDocument();
      expect(screen.getByTestId('button-confirm-add')).toBeInTheDocument();
      expect(screen.getByTestId('button-cancel-add')).toBeInTheDocument();
    });
  });

  it('adds collaborator when form is submitted', async () => {
    mockAdd.mockResolvedValue(true);

    render(
      <CollaboratorsCard 
        classId="test-class-1" 
        currentUserEmail="teacher@school.edu"
        isOwner={true}
      />
    );

    // Open add form
    fireEvent.click(screen.getByTestId('button-add-collaborator'));

    // Fill form
    const emailInput = screen.getByTestId('input-collaborator-email');
    const roleSelect = screen.getByTestId('select-collaborator-role');
    
    fireEvent.change(emailInput, { target: { value: 'new@school.edu' } });
    fireEvent.change(roleSelect, { target: { value: 'co_teacher' } });

    // Submit form
    fireEvent.click(screen.getByTestId('button-confirm-add'));

    await waitFor(() => {
      expect(mockAdd).toHaveBeenCalledWith('new@school.edu', 'co_teacher');
      expect(mockToast).toHaveBeenCalledWith({
        kind: 'success',
        text: 'Co-teacher added successfully'
      });
    });
  });

  it('removes collaborator when remove button is clicked', async () => {
    const mockCollaborators = [
      {
        classId: 'test-class-1',
        email: 'co-teacher@school.edu',
        role: 'co_teacher' as const,
        addedAt: Date.now()
      }
    ];

    mockUseCollaborators.mockReturnValue({
      collaborators: mockCollaborators,
      loading: false,
      error: null,
      add: mockAdd,
      remove: mockRemove,
      refresh: mockRefresh
    });

    mockRemove.mockResolvedValue(true);

    render(
      <CollaboratorsCard 
        classId="test-class-1" 
        currentUserEmail="teacher@school.edu"
        isOwner={true}
      />
    );

    const removeButton = screen.getByTestId('button-remove-co-teacher@school.edu');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith('co-teacher@school.edu');
      expect(mockToast).toHaveBeenCalledWith({
        kind: 'success',
        text: 'Collaborator removed successfully'
      });
    });
  });

  it('does not show add/remove buttons for non-owners', () => {
    const mockCollaborators = [
      {
        classId: 'test-class-1',
        email: 'co-teacher@school.edu',
        role: 'co_teacher' as const,
        addedAt: Date.now()
      }
    ];

    mockUseCollaborators.mockReturnValue({
      collaborators: mockCollaborators,
      loading: false,
      error: null,
      add: mockAdd,
      remove: mockRemove,
      refresh: mockRefresh
    });

    render(
      <CollaboratorsCard 
        classId="test-class-1" 
        currentUserEmail="teacher@school.edu"
        isOwner={false}
      />
    );

    expect(screen.queryByTestId('button-add-collaborator')).not.toBeInTheDocument();
    expect(screen.queryByTestId('button-remove-co-teacher@school.edu')).not.toBeInTheDocument();
  });

  it('shows error message when there is an error', () => {
    mockUseCollaborators.mockReturnValue({
      collaborators: [],
      loading: false,
      error: 'Failed to load collaborators',
      add: mockAdd,
      remove: mockRemove,
      refresh: mockRefresh
    });

    render(
      <CollaboratorsCard 
        classId="test-class-1" 
        currentUserEmail="teacher@school.edu"
        isOwner={true}
      />
    );

    expect(screen.getByText('Failed to load collaborators')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseCollaborators.mockReturnValue({
      collaborators: [],
      loading: true,
      error: null,
      add: mockAdd,
      remove: mockRemove,
      refresh: mockRefresh
    });

    render(
      <CollaboratorsCard 
        classId="test-class-1" 
        currentUserEmail="teacher@school.edu"
        isOwner={true}
      />
    );

    expect(screen.getByText('Loading collaborators...')).toBeInTheDocument();
  });
});
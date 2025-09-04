import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClassModeCTA, useClassModeDetection } from '../src/components/classmode/ClassModeCTA';
import { useProjectorAvatar } from '../src/hooks/useProjectorAvatar';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock external dependencies
vi.mock('../src/roster/classes', () => ({
  findByCode: vi.fn()
}));

vi.mock('../src/hooks/useProjectorMode', () => ({
  useProjectorSafeName: vi.fn((name, fallback) => name || fallback)
}));

vi.mock('../src/guide/useActiveClass', () => ({
  useActiveClass: vi.fn()
}));

vi.mock('../src/utils/assignmentNudges', () => ({
  checkAssignmentNudges: vi.fn()
}));

// Mock UI components
vi.mock('../src/components/ui/button', () => ({
  Button: ({ children, onClick, 'data-testid': testid, className }: any) => (
    <button onClick={onClick} data-testid={testid} className={className}>
      {children}
    </button>
  )
}));

vi.mock('../src/components/ui/card', () => ({
  Card: ({ children, className, 'data-testid': testid }: any) => (
    <div className={className} data-testid={testid}>{children}</div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>
}));

// Import the mocked modules
import { findByCode } from '../src/roster/classes';
import { useActiveClass } from '../src/guide/useActiveClass';

const mockFindByCode = findByCode as any;
const mockUseActiveClass = useActiveClass as any;

describe('ClassModeCTA', () => {
  const mockProps = {
    onStartActivity: vi.fn(),
    onFocusLesson: vi.fn(),
    onDismiss: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    
    // Setup default mocks
    mockUseActiveClass.mockReturnValue({ activeClass: null });
  });

  describe('Banner Display', () => {
    it('does not render when no class code is stored', () => {
      const result = render(<ClassModeCTA {...mockProps} />);
      
      expect(screen.queryByTestId('class-mode-cta')).not.toBeInTheDocument();
    });

    it('renders banner when valid class code is present', () => {
      // Setup localStorage with class code
      mockLocalStorage.setItem('qi.lastClassCode', 'ABC123');
      mockLocalStorage.setItem('qi.lastClassName', 'Test Class');
      
      // Mock findByCode to return valid class
      mockFindByCode.mockReturnValue({
        id: 'class1',
        name: 'Test Class',
        code: 'ABC123',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      render(<ClassModeCTA {...mockProps} />);
      
      expect(screen.getByTestId('class-mode-cta')).toBeInTheDocument();
      expect(screen.getByText('Class Mode')).toBeInTheDocument();
      expect(screen.getByText(/Continue learning with/)).toBeInTheDocument();
    });

    it('clears stored data when class no longer exists', () => {
      // Setup localStorage with class code
      mockLocalStorage.setItem('qi.lastClassCode', 'ABC123');
      mockLocalStorage.setItem('qi.lastClassName', 'Test Class');
      
      // Mock findByCode to return null (class doesn't exist)
      mockFindByCode.mockReturnValue(null);

      render(<ClassModeCTA {...mockProps} />);
      
      expect(mockLocalStorage.getItem('qi.lastClassCode')).toBeNull();
      expect(mockLocalStorage.getItem('qi.lastClassName')).toBeNull();
      expect(screen.queryByTestId('class-mode-cta')).not.toBeInTheDocument();
    });
  });

  describe('Start Now Button', () => {
    beforeEach(() => {
      // Setup localStorage with class code
      mockLocalStorage.setItem('qi.lastClassCode', 'ABC123');
      mockLocalStorage.setItem('qi.lastClassName', 'Test Class');
      
      // Mock findByCode to return valid class
      mockFindByCode.mockReturnValue({
        id: 'class1',
        name: 'Test Class',
        code: 'ABC123',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    });

    it('shows "Start Now" when assignments are available', () => {
      // Mock assignments are available
      mockLocalStorage.setItem('qi.local-1.assigned.paths.v1', '["lesson1", "lesson2"]');
      
      render(<ClassModeCTA {...mockProps} />);
      
      const startButton = screen.getByTestId('button-start-now');
      expect(startButton).toBeInTheDocument();
      expect(startButton).toHaveTextContent('Start Now');
      
      // Should show compass recommendation
      expect(screen.getByText('🎯 Compass recommended activities ready')).toBeInTheDocument();
    });

    it('shows "Continue Learning" when no assignments', () => {
      // No assignments stored
      render(<ClassModeCTA {...mockProps} />);
      
      const startButton = screen.getByTestId('button-start-now');
      expect(startButton).toBeInTheDocument();
      expect(startButton).toHaveTextContent('Continue Learning');
      
      // Should not show compass recommendation
      expect(screen.queryByText('🎯 Compass recommended activities ready')).not.toBeInTheDocument();
    });

    it('calls onStartActivity when clicked', () => {
      render(<ClassModeCTA {...mockProps} />);
      
      const startButton = screen.getByTestId('button-start-now');
      fireEvent.click(startButton);
      
      expect(mockProps.onStartActivity).toHaveBeenCalledWith('ABC123');
    });
  });

  describe('Exit Class Mode', () => {
    beforeEach(() => {
      // Setup localStorage with class code
      mockLocalStorage.setItem('qi.lastClassCode', 'ABC123');
      mockLocalStorage.setItem('qi.lastClassName', 'Test Class');
      
      // Mock findByCode to return valid class
      mockFindByCode.mockReturnValue({
        id: 'class1',
        name: 'Test Class',
        code: 'ABC123',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    });

    it('renders exit class mode link', () => {
      render(<ClassModeCTA {...mockProps} />);
      
      const exitLink = screen.getByTestId('link-exit-class-mode');
      expect(exitLink).toBeInTheDocument();
      expect(exitLink).toHaveTextContent('Exit class mode');
    });

    it('clears stored data and calls onDismiss when exit is clicked', () => {
      render(<ClassModeCTA {...mockProps} />);
      
      const exitLink = screen.getByTestId('link-exit-class-mode');
      fireEvent.click(exitLink);
      
      expect(mockLocalStorage.getItem('qi.lastClassCode')).toBeNull();
      expect(mockLocalStorage.getItem('qi.lastClassName')).toBeNull();
      expect(mockProps.onDismiss).toHaveBeenCalled();
    });
  });
});

describe('useClassModeDetection', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('returns false when no class code is stored', () => {
    const TestComponent = () => {
      const { hasLastClassCode } = useClassModeDetection();
      return <div data-testid="has-class-code">{hasLastClassCode.toString()}</div>;
    };

    render(<TestComponent />);
    
    expect(screen.getByTestId('has-class-code')).toHaveTextContent('false');
  });

  it('returns true when class code is stored', () => {
    mockLocalStorage.setItem('qi.lastClassCode', 'ABC123');
    
    const TestComponent = () => {
      const { hasLastClassCode } = useClassModeDetection();
      return <div data-testid="has-class-code">{hasLastClassCode.toString()}</div>;
    };

    render(<TestComponent />);
    
    expect(screen.getByTestId('has-class-code')).toHaveTextContent('true');
  });
});

describe('useProjectorAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initials when hideNames is true', () => {
    // Mock active class with hideNames enabled
    mockUseActiveClass.mockReturnValue({
      activeClass: {
        projectorPreset: {
          hideNames: true
        }
      }
    });

    const TestComponent = () => {
      const { getAvatarInfo } = useProjectorAvatar();
      const avatarInfo = getAvatarInfo('John Smith');
      
      return (
        <div>
          <span data-testid="display-name">{avatarInfo.displayName}</span>
          <span data-testid="initials">{avatarInfo.initials}</span>
          <span data-testid="should-show-initials">{avatarInfo.shouldShowInitials.toString()}</span>
        </div>
      );
    };

    render(<TestComponent />);
    
    expect(screen.getByTestId('display-name')).toHaveTextContent('Student');
    expect(screen.getByTestId('initials')).toHaveTextContent('JS');
    expect(screen.getByTestId('should-show-initials')).toHaveTextContent('true');
  });

  it('returns real names when hideNames is false', () => {
    // Mock active class with hideNames disabled
    mockUseActiveClass.mockReturnValue({
      activeClass: {
        projectorPreset: {
          hideNames: false
        }
      }
    });

    const TestComponent = () => {
      const { getAvatarInfo } = useProjectorAvatar();
      const avatarInfo = getAvatarInfo('John Smith');
      
      return (
        <div>
          <span data-testid="display-name">{avatarInfo.displayName}</span>
          <span data-testid="initials">{avatarInfo.initials || 'null'}</span>
          <span data-testid="should-show-initials">{avatarInfo.shouldShowInitials.toString()}</span>
        </div>
      );
    };

    render(<TestComponent />);
    
    expect(screen.getByTestId('display-name')).toHaveTextContent('John Smith');
    expect(screen.getByTestId('initials')).toHaveTextContent('null');
    expect(screen.getByTestId('should-show-initials')).toHaveTextContent('false');
  });

  it('handles single names correctly', () => {
    mockUseActiveClass.mockReturnValue({
      activeClass: {
        projectorPreset: {
          hideNames: true
        }
      }
    });

    const TestComponent = () => {
      const { getAnonymousInitials } = useProjectorAvatar();
      const initials = getAnonymousInitials('Alice');
      
      return <span data-testid="single-name-initials">{initials}</span>;
    };

    render(<TestComponent />);
    
    expect(screen.getByTestId('single-name-initials')).toHaveTextContent('AL');
  });

  it('handles empty names correctly', () => {
    mockUseActiveClass.mockReturnValue({
      activeClass: {
        projectorPreset: {
          hideNames: true
        }
      }
    });

    const TestComponent = () => {
      const { getAnonymousInitials } = useProjectorAvatar();
      const initials = getAnonymousInitials('');
      
      return <span data-testid="empty-name-initials">{initials}</span>;
    };

    render(<TestComponent />);
    
    expect(screen.getByTestId('empty-name-initials')).toHaveTextContent('??');
  });
});
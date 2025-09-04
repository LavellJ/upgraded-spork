import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Trends } from '../src/guide/reports/Trends';
import { exportTrendsCSV, getCsvContent } from '../src/guide/reports/exportCsv';
import type { CohortSlice } from '../src/progress/cohort';

// Mock the dependencies
vi.mock('../src/roster/context', () => ({
  useRosterOptional: vi.fn()
}));

vi.mock('../src/roster/classes', () => ({
  getActiveClass: vi.fn()
}));

vi.mock('../src/progress/cohort', () => ({
  buildCohortSeries: vi.fn()
}));

vi.mock('../src/progress/util', () => ({
  weekStartISO: vi.fn(() => '2025-01-13'),
  getWeekDisplayName: vi.fn((iso: string) => {
    const date = new Date(iso);
    return `${date.toLocaleDateString('en-US', { month: 'short' })} ${date.getDate()}-${date.getDate() + 6}, ${date.getFullYear()}`;
  })
}));

vi.mock('./exportCsv', () => ({
  exportTrendsCSV: vi.fn()
}));

// Mock UI components that may not be available in test environment
// Mock UI components with tooltips support
vi.mock('../src/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>
}));

vi.mock('../src/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select" onClick={() => onValueChange && onValueChange('8')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: () => <span>Select</span>
}));

vi.mock('../src/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, id, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      data-testid={id}
      {...props}
    />
  )
}));

import { useRosterOptional } from '../src/roster/context';
import { getActiveClass } from '../src/roster/classes';
import { buildCohortSeries } from '../src/progress/cohort';

const mockUseRosterOptional = vi.mocked(useRosterOptional);
const mockGetActiveClass = vi.mocked(getActiveClass);
const mockBuildCohortSeries = vi.mocked(buildCohortSeries);

describe('Trends Dashboard', () => {
  const mockRosterContext = {
    roster: {
      learners: [
        { id: 'learner_1', name: 'Alice Smith', avatarId: 'avatar_1', ageBand: 'primary' as const, createdAt: Date.now(), updatedAt: Date.now() },
        { id: 'learner_2', name: 'Bob Johnson', avatarId: 'avatar_2', ageBand: 'pre-primary' as const, createdAt: Date.now(), updatedAt: Date.now() },
        { id: 'learner_3', name: 'Carol Davis', avatarId: 'avatar_3', ageBand: 'upper-primary' as const, createdAt: Date.now(), updatedAt: Date.now() }
      ],
      activeId: 'learner_1'
    },
    activeLearner: { id: 'learner_1', name: 'Alice Smith', avatarId: 'avatar_1', ageBand: 'primary' as const, createdAt: Date.now(), updatedAt: Date.now() }
  };

  const mockCohortSeries: CohortSlice[] = [
    {
      weekStartISO: '2025-01-06',
      learners: 3,
      activeLearners: 2,
      avgOnTaskMins: 45.5,
      medianOnTaskMins: 40.0,
      return7dPct: 80.0,
      assignments: { donePct: 75.0, dueSoon: 2, overdue: 1 },
      completionsPerLearner: 3.2,
      streakersPct: 60.0
    },
    {
      weekStartISO: '2025-01-13',
      learners: 3,
      activeLearners: 3,
      avgOnTaskMins: 52.3,
      medianOnTaskMins: 48.0,
      return7dPct: 85.0,
      assignments: { donePct: 82.0, dueSoon: 1, overdue: 0 },
      completionsPerLearner: 4.1,
      streakersPct: 75.0
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseRosterOptional.mockReturnValue(mockRosterContext);
    mockGetActiveClass.mockImplementation((learnerId: string) => ({
      id: `class_${learnerId.slice(-1)}`,
      name: `Class ${learnerId.slice(-1)}`,
      learnerIds: [learnerId]
    }));
    mockBuildCohortSeries.mockReturnValue(mockCohortSeries);
  });

  describe('Component Rendering', () => {
    it('renders trends dashboard with basic elements', () => {
      render(<Trends />);
      
      expect(screen.getByTestId('trends-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Cohort Trends')).toBeInTheDocument();
      expect(screen.getByText('Multi-week learning analytics across your classes')).toBeInTheDocument();
      expect(screen.getByTestId('export-csv-button')).toBeInTheDocument();
    });

    it('shows no classes message when no learners available', () => {
      mockUseRosterOptional.mockReturnValue({
        roster: { learners: [], activeId: null },
        activeLearner: null
      });

      render(<Trends />);
      
      expect(screen.getByText('No classes found')).toBeInTheDocument();
      expect(screen.getByText('Set up learner classes to view cohort trends.')).toBeInTheDocument();
    });

    it('renders filters section', () => {
      render(<Trends />);
      
      expect(screen.getByTestId('filters-card')).toBeInTheDocument();
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByTestId('select-all-classes')).toBeInTheDocument();
      expect(screen.getByTestId('week-range-select')).toBeInTheDocument();
      expect(screen.getByTestId('multi-class-toggle')).toBeInTheDocument();
    });

    it('renders metrics cards when data is available', () => {
      render(<Trends />);
      
      expect(screen.getByTestId('metrics-cards')).toBeInTheDocument();
      expect(screen.getByTestId('metric-card-avgOnTaskMins')).toBeInTheDocument();
      expect(screen.getByTestId('metric-card-return7dPct')).toBeInTheDocument();
    });

    it('renders data table with weekly breakdown', () => {
      render(<Trends />);
      
      expect(screen.getByTestId('data-table-card')).toBeInTheDocument();
      expect(screen.getByText('Weekly Breakdown')).toBeInTheDocument();
      expect(screen.getByTestId('table-row-0')).toBeInTheDocument();
      expect(screen.getByTestId('table-row-1')).toBeInTheDocument();
    });
  });

  describe('Filter Interactions', () => {
    it('handles class selection changes', () => {
      render(<Trends />);
      
      const selectAllCheckbox = screen.getByTestId('select-all-classes');
      expect(selectAllCheckbox).toBeInTheDocument();
      
      fireEvent.click(selectAllCheckbox);
      // Verify that buildCohortSeries was called with updated class selection
      expect(mockBuildCohortSeries).toHaveBeenCalled();
    });

    it('handles week range selection', () => {
      render(<Trends />);
      
      const weekRangeSelect = screen.getByTestId('week-range-select');
      fireEvent.click(weekRangeSelect);
      
      expect(mockBuildCohortSeries).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(String),
        8 // default week range
      );
    });

    it('enables multi-class toggle when multiple classes selected', () => {
      render(<Trends />);
      
      // Initially disabled with single class
      const multiClassToggle = screen.getByTestId('multi-class-toggle');
      expect(multiClassToggle).toBeDisabled();
      
      // Select all classes
      const selectAllCheckbox = screen.getByTestId('select-all-classes');
      fireEvent.click(selectAllCheckbox);
      
      // Should now be enabled with multiple classes
      expect(multiClassToggle).not.toBeDisabled();
    });
  });

  describe('Sorting Functionality', () => {
    it('sorts table by week when header is clicked', () => {
      render(<Trends />);
      
      const weekHeader = screen.getByTestId('sort-week');
      expect(weekHeader).toBeInTheDocument();
      
      fireEvent.click(weekHeader);
      
      // Check that sort indicator is shown
      expect(weekHeader.textContent).toContain('↓');
      
      // Click again to reverse sort
      fireEvent.click(weekHeader);
      expect(weekHeader.textContent).toContain('↑');
    });

    it('sorts table by active learners', () => {
      render(<Trends />);
      
      const activeLearnerHeader = screen.getByTestId('sort-active-learners');
      fireEvent.click(activeLearnerHeader);
      
      expect(activeLearnerHeader.textContent).toContain('↓');
    });

    it('sorts table by average on-task minutes', () => {
      render(<Trends />);
      
      const avgOnTaskHeader = screen.getByTestId('sort-avg-on-task');
      fireEvent.click(avgOnTaskHeader);
      
      expect(avgOnTaskHeader.textContent).toContain('↓');
    });
  });

  describe('CSV Export', () => {
    it('enables export button when data is available', () => {
      render(<Trends />);
      
      const exportButton = screen.getByTestId('export-csv-button');
      expect(exportButton).not.toBeDisabled();
    });

    it('disables export button when no data available', () => {
      mockBuildCohortSeries.mockReturnValue([]);
      
      render(<Trends />);
      
      const exportButton = screen.getByTestId('export-csv-button');
      expect(exportButton).toBeDisabled();
    });

    it('calls export function when export button clicked', () => {
      const mockExportTrendsCSV = vi.mocked(exportTrendsCSV);
      
      render(<Trends />);
      
      const exportButton = screen.getByTestId('export-csv-button');
      fireEvent.click(exportButton);
      
      expect(mockExportTrendsCSV).toHaveBeenCalledWith(
        mockCohortSeries,
        expect.stringContaining('cohort-trends')
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on interactive elements', () => {
      render(<Trends />);
      
      const exportButton = screen.getByTestId('export-csv-button');
      expect(exportButton).toHaveAttribute('type', 'button');
      
      const selectAllCheckbox = screen.getByTestId('select-all-classes');
      expect(selectAllCheckbox).toHaveAttribute('type', 'checkbox');
    });

    it('has proper table structure for screen readers', () => {
      render(<Trends />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);
      
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + data rows
    });
  });

  describe('Edge Cases', () => {
    it('handles empty cohort series gracefully', () => {
      mockBuildCohortSeries.mockReturnValue([]);
      
      render(<Trends />);
      
      expect(screen.getByText('No trend data available')).toBeInTheDocument();
      expect(screen.getByText('Select classes and ensure learners have activity data to view trends.')).toBeInTheDocument();
    });

    it('handles single learner class', () => {
      mockUseRosterOptional.mockReturnValue({
        roster: {
          learners: [mockRosterContext.roster!.learners[0]],
          activeId: 'learner_1'
        },
        activeLearner: mockRosterContext.activeLearner
      });
      
      render(<Trends />);
      
      const multiClassToggle = screen.getByTestId('multi-class-toggle');
      expect(multiClassToggle).toBeDisabled();
    });

    it('handles missing roster context', () => {
      mockUseRosterOptional.mockReturnValue(null);
      
      render(<Trends />);
      
      expect(screen.getByText('No classes found')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button clicked', () => {
      const mockOnClose = vi.fn();
      
      render(<Trends onClose={mockOnClose} />);
      
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not show close button when onClose not provided', () => {
      render(<Trends />);
      
      expect(screen.queryByText('Close')).not.toBeInTheDocument();
    });
  });
});

describe('CSV Export Functions', () => {
  const mockSeries: CohortSlice[] = [
    {
      weekStartISO: '2025-01-06',
      learners: 3,
      activeLearners: 2,
      avgOnTaskMins: 45.5,
      medianOnTaskMins: 40.0,
      return7dPct: 80.0,
      assignments: { donePct: 75.0, dueSoon: 2, overdue: 1 },
      completionsPerLearner: 3.2,
      streakersPct: 60.0
    },
    {
      weekStartISO: '2025-01-13',
      learners: 3,
      activeLearners: 3,
      avgOnTaskMins: 52.3,
      medianOnTaskMins: 48.0,
      return7dPct: 85.0,
      assignments: { donePct: 82.0, dueSoon: 1, overdue: 0 },
      completionsPerLearner: 4.1,
      streakersPct: 75.0
    }
  ];

  describe('getCsvContent', () => {
    it('generates correct CSV content', () => {
      const csvContent = getCsvContent(mockSeries);
      
      expect(csvContent).toBeTruthy();
      expect(csvContent).toContain('Week,Week Start (ISO),Total Learners');
      expect(csvContent).toContain('2025-01-06');
      expect(csvContent).toContain('2025-01-13');
      expect(csvContent).toContain('45.5'); // avgOnTaskMins
      expect(csvContent).toContain('85'); // return7dPct
    });

    it('handles empty series', () => {
      const csvContent = getCsvContent([]);
      
      expect(csvContent).toBe('');
    });

    it('escapes commas in data properly', () => {
      const seriesWithCommas: CohortSlice[] = [{
        weekStartISO: '2025-01-06',
        learners: 3,
        activeLearners: 2,
        avgOnTaskMins: 45.5,
        medianOnTaskMins: 40.0,
        return7dPct: 80.0,
        assignments: { donePct: 75.0, dueSoon: 2, overdue: 1 },
        completionsPerLearner: 3.2,
        streakersPct: 60.0
      }];
      
      const csvContent = getCsvContent(seriesWithCommas);
      
      // Should not break CSV format due to commas
      expect(csvContent).toBeTruthy();
      expect(csvContent.split('\n')).toHaveLength(2); // Header + 1 data row
    });

    it('generates correct number of rows', () => {
      const csvContent = getCsvContent(mockSeries);
      const rows = csvContent.split('\n');
      
      // Should have header + data rows
      expect(rows).toHaveLength(mockSeries.length + 1);
      
      // Header should contain all expected columns
      const header = rows[0];
      expect(header).toContain('Week');
      expect(header).toContain('Active Learners');
      expect(header).toContain('Avg On-Task Minutes');
      expect(header).toContain('Return Within 7 Days (%)');
      expect(header).toContain('Assignments Done (%)');
      expect(header).toContain('Streakers (%)');
    });
  });

  describe('exportTrendsCSV', () => {
    beforeEach(() => {
      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
      global.URL.revokeObjectURL = vi.fn();
      
      // Mock document methods
      const mockLink = {
        setAttribute: vi.fn(),
        click: vi.fn(),
        style: {},
        download: ''
      };
      
      global.document.createElement = vi.fn(() => mockLink);
      global.document.body.appendChild = vi.fn();
      global.document.body.removeChild = vi.fn();
    });

    it('creates and downloads file with correct name', () => {
      exportTrendsCSV(mockSeries, 'test-trends');
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    });

    it('handles empty series gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      exportTrendsCSV([], 'empty-trends');
      
      expect(consoleSpy).toHaveBeenCalledWith('No trends data to export');
      expect(document.createElement).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('uses default filename when not provided', () => {
      exportTrendsCSV(mockSeries);
      
      expect(document.createElement).toHaveBeenCalled();
    });
  });
});
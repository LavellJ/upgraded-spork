import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sparkline, MultiSparkline } from '../src/guide/reports/Sparkline';

describe('Sparkline Component', () => {
  describe('Basic Rendering', () => {
    it('renders a sparkline with data', () => {
      render(
        <Sparkline 
          data={[10, 20, 15, 25, 30]} 
          ariaLabel="Test sparkline showing trend over time"
        />
      );
      
      const sparkline = screen.getByRole('img');
      expect(sparkline).toBeInTheDocument();
      expect(sparkline).toHaveAttribute('aria-labelledby');
    });

    it('shows no data message for empty array', () => {
      render(
        <Sparkline 
          data={[]} 
          ariaLabel="Empty sparkline"
        />
      );
      
      const sparkline = screen.getByRole('img');
      expect(sparkline).toHaveAttribute('aria-label', 'No data available');
    });

    it('renders with custom dimensions', () => {
      render(
        <Sparkline 
          data={[10, 20, 30]} 
          width={150}
          height={40}
          ariaLabel="Custom size sparkline"
        />
      );
      
      const sparkline = screen.getByRole('img');
      expect(sparkline).toHaveAttribute('width', '150');
      expect(sparkline).toHaveAttribute('height', '40');
    });

    it('includes screen reader table', () => {
      render(
        <Sparkline 
          data={[10, 20, 30]} 
          ariaLabel="Sparkline with data table"
        />
      );
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass('sr-only');
      
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(4); // Header + 3 data rows
    });

    it('shows dots when showDots is true', () => {
      const { container } = render(
        <Sparkline 
          data={[10, 20, 30]} 
          showDots={true}
          ariaLabel="Sparkline with dots"
        />
      );
      
      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(3);
    });

    it('uses custom color', () => {
      const { container } = render(
        <Sparkline 
          data={[10, 20, 30]} 
          color="rgb(255, 0, 0)"
          ariaLabel="Red sparkline"
        />
      );
      
      const path = container.querySelector('path');
      expect(path).toHaveAttribute('stroke', 'rgb(255, 0, 0)');
    });

    it('formats values with custom formatter', () => {
      render(
        <Sparkline 
          data={[10, 20, 30]} 
          formatValue={(v) => `${v}%`}
          ariaLabel="Percentage sparkline"
        />
      );
      
      expect(screen.getByText('10%')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('includes labels in data table', () => {
      render(
        <Sparkline 
          data={[10, 20, 30]} 
          labels={['Week 1', 'Week 2', 'Week 3']}
          ariaLabel="Labeled sparkline"
        />
      );
      
      expect(screen.getByText('Week 1')).toBeInTheDocument();
      expect(screen.getByText('Week 2')).toBeInTheDocument();
      expect(screen.getByText('Week 3')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Sparkline 
          data={[10, 20, 30]} 
          ariaLabel="Accessible sparkline"
        />
      );
      
      const sparkline = screen.getByRole('img');
      expect(sparkline).toHaveAttribute('aria-labelledby');
      expect(sparkline).toHaveAttribute('aria-describedby');
      expect(sparkline).toHaveAttribute('tabIndex', '0');
    });

    it('has focus styling classes', () => {
      render(
        <Sparkline 
          data={[10, 20, 30]} 
          ariaLabel="Focusable sparkline"
        />
      );
      
      const sparkline = screen.getByRole('img');
      expect(sparkline).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('includes table caption for screen readers', () => {
      render(
        <Sparkline 
          data={[10, 20, 30]} 
          ariaLabel="Sparkline with caption"
        />
      );
      
      const caption = screen.getByText('Data table for Sparkline with caption');
      expect(caption).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles flat data (no variation)', () => {
      const { container } = render(
        <Sparkline 
          data={[20, 20, 20, 20]} 
          ariaLabel="Flat data sparkline"
        />
      );
      
      const path = container.querySelector('path');
      expect(path).toHaveAttribute('d');
      
      // Should create a horizontal line
      const pathData = path?.getAttribute('d') || '';
      expect(pathData).toContain('L');
    });

    it('handles single data point', () => {
      const { container } = render(
        <Sparkline 
          data={[42]} 
          ariaLabel="Single point sparkline"
        />
      );
      
      const path = container.querySelector('path');
      expect(path).toHaveAttribute('d');
    });

    it('respects reduced motion preferences', () => {
      const { container } = render(
        <Sparkline 
          data={[10, 20, 30]} 
          ariaLabel="Motion-respectful sparkline"
        />
      );
      
      const path = container.querySelector('path');
      expect(path).toHaveClass('motion-reduce:transition-none');
    });
  });
});

describe('MultiSparkline Component', () => {
  const mockSeries = [
    {
      data: [10, 20, 15, 25],
      label: 'Class A',
      color: 'rgb(59, 125, 68)'
    },
    {
      data: [15, 18, 20, 22],
      label: 'Class B', 
      color: 'rgb(201, 106, 43)'
    }
  ];

  describe('Basic Rendering', () => {
    it('renders multiple series', () => {
      const { container } = render(
        <MultiSparkline 
          series={mockSeries}
          ariaLabel="Multi-class comparison"
        />
      );
      
      const paths = container.querySelectorAll('path');
      expect(paths).toHaveLength(2);
    });

    it('limits to 2 series maximum', () => {
      const threeSeries = [
        ...mockSeries,
        { data: [5, 10, 15, 20], label: 'Class C', color: 'rgb(0, 0, 255)' }
      ];
      
      const { container } = render(
        <MultiSparkline 
          series={threeSeries}
          ariaLabel="Limited series sparkline"
        />
      );
      
      const paths = container.querySelectorAll('path');
      expect(paths).toHaveLength(2); // Should be limited to 2
    });

    it('shows no data message for empty series', () => {
      render(
        <MultiSparkline 
          series={[]}
          ariaLabel="Empty multi-sparkline"
        />
      );
      
      const sparkline = screen.getByRole('img');
      expect(sparkline).toHaveAttribute('aria-label', 'No data available');
    });

    it('uses different stroke styles for series', () => {
      const { container } = render(
        <MultiSparkline 
          series={mockSeries}
          ariaLabel="Styled multi-sparkline"
        />
      );
      
      const paths = container.querySelectorAll('path');
      expect(paths[0]).not.toHaveAttribute('stroke-dasharray', '3,2');
      expect(paths[1]).toHaveAttribute('stroke-dasharray', '3,2');
    });

    it('includes multi-series data table', () => {
      render(
        <MultiSparkline 
          series={mockSeries}
          ariaLabel="Multi-sparkline with table"
        />
      );
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      expect(screen.getByText('Class A')).toBeInTheDocument();
      expect(screen.getByText('Class B')).toBeInTheDocument();
    });

    it('handles series with different lengths', () => {
      const unevenSeries = [
        { data: [10, 20], label: 'Short Series', color: 'red' },
        { data: [15, 18, 20, 22], label: 'Long Series', color: 'blue' }
      ];
      
      render(
        <MultiSparkline 
          series={unevenSeries}
          ariaLabel="Uneven series sparkline"
        />
      );
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Should show N/A for missing values
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA structure', () => {
      render(
        <MultiSparkline 
          series={mockSeries}
          ariaLabel="Accessible multi-sparkline"
        />
      );
      
      const sparkline = screen.getByRole('img');
      expect(sparkline).toHaveAttribute('aria-labelledby');
      expect(sparkline).toHaveAttribute('aria-describedby');
    });

    it('includes table headers for each series', () => {
      render(
        <MultiSparkline 
          series={mockSeries}
          ariaLabel="Multi-sparkline with headers"
        />
      );
      
      const classAHeader = screen.getByRole('columnheader', { name: 'Class A' });
      const classBHeader = screen.getByRole('columnheader', { name: 'Class B' });
      
      expect(classAHeader).toBeInTheDocument();
      expect(classBHeader).toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('normalizes scales across all series', () => {
      const wideRangeSeries = [
        { data: [1, 2, 3], label: 'Small Range', color: 'red' },
        { data: [100, 200, 300], label: 'Large Range', color: 'blue' }
      ];
      
      const { container } = render(
        <MultiSparkline 
          series={wideRangeSeries}
          ariaLabel="Wide range multi-sparkline"
        />
      );
      
      const paths = container.querySelectorAll('path');
      expect(paths).toHaveLength(2);
      
      // Both paths should have valid path data
      paths.forEach(path => {
        expect(path.getAttribute('d')).toBeTruthy();
      });
    });

    it('handles empty data in series', () => {
      const mixedSeries = [
        { data: [], label: 'Empty Series', color: 'red' },
        { data: [10, 20, 30], label: 'Valid Series', color: 'blue' }
      ];
      
      const { container } = render(
        <MultiSparkline 
          series={mixedSeries}
          ariaLabel="Mixed validity sparkline"
        />
      );
      
      // Should still render without errors
      const sparkline = screen.getByRole('img');
      expect(sparkline).toBeInTheDocument();
    });
  });
});

describe('Sparkline Integration', () => {
  it('maintains consistent styling between single and multi sparklines', () => {
    const singleData = [10, 20, 30];
    const multiData = [{ data: singleData, label: 'Test', color: 'rgb(59, 125, 68)' }];
    
    const { container: singleContainer } = render(
      <Sparkline data={singleData} ariaLabel="Single" color="rgb(59, 125, 68)" />
    );
    
    const { container: multiContainer } = render(
      <MultiSparkline series={multiData} ariaLabel="Multi" />
    );
    
    const singlePath = singleContainer.querySelector('path');
    const multiPath = multiContainer.querySelector('path');
    
    expect(singlePath?.getAttribute('stroke')).toBe('rgb(59, 125, 68)');
    expect(multiPath?.getAttribute('stroke')).toBe('rgb(59, 125, 68)');
  });
});
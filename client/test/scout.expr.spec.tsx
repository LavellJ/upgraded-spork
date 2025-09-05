import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScoutSprite from '../src/learning/ScoutSprite';
import ScoutAvatar from '../src/learning/ScoutAvatar';

// Mock the Flags module
vi.mock('../src/config/flags', () => ({
  Flags: {
    get: vi.fn(() => ({ finalArt: true }))
  }
}));

// Mock fetch for SVG loading
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Scout Expression System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fallback image when SVG not available', async () => {
    // Mock fetch to reject (SVG not available)
    mockFetch.mockRejectedValue(new Error('Not found'));
    
    render(<ScoutSprite size={96} />);
    
    // Should show raster fallback
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/art/scout/scout-neutral.webp');
    expect(img).toHaveAttribute('width', '96');
    expect(img).toHaveAttribute('height', '96');
  });

  it('renders SVG when available', async () => {
    // Mock successful SVG fetch
    const mockSvg = `<svg viewBox="0 0 128 128">
      <g id="pose-neutral"><circle cx="64" cy="64" r="40" fill="#F2F5F8"/></g>
      <g id="pose-happy" style="display:none"><circle cx="64" cy="64" r="40" fill="#F2F5F8"/></g>
    </svg>`;
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockSvg)
    });
    
    render(<ScoutSprite size={96} />);
    
    // Wait for SVG to load and render
    await waitFor(() => {
      const svgElement = document.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
      expect(svgElement).toHaveAttribute('width', '96');
      expect(svgElement).toHaveAttribute('height', '96');
    });
  });

  it('renders with correct wrapper structure', () => {
    render(<ScoutAvatar size={48} alt="Test Scout" />);
    
    const wrapper = document.getElementById('scout-sprite');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveAttribute('aria-label', 'Test Scout');
    expect(wrapper).toHaveAttribute('role', 'img');
    
    const img = screen.getByAltText('Scout');
    expect(img).toBeInTheDocument();
  });

  it('applies art-shadow class', async () => {
    mockFetch.mockRejectedValue(new Error('Not found'));
    
    render(<ScoutSprite size={96} />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveClass('art-shadow');
    expect(img).toHaveClass('rounded-xl');
    expect(img).toHaveClass('select-none');
  });

  it('handles different sizes correctly', async () => {
    mockFetch.mockRejectedValue(new Error('Not found'));
    
    const { rerender } = render(<ScoutSprite size={48} />);
    
    let img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '48');
    expect(img).toHaveAttribute('height', '48');
    
    rerender(<ScoutSprite size={128} />);
    
    img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '128');
    expect(img).toHaveAttribute('height', '128');
  });
});
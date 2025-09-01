import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('App Smoke Tests', () => {
  it('renders map and subject nodes (Literacy/Math/Science/HASS labels present)', () => {
    render(<App />);
    
    // Check that all subject labels are present
    expect(screen.getByText('Literacy')).toBeInTheDocument();
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
    expect(screen.getByText('HASS')).toBeInTheDocument();
    
    // Check that the main app title is present
    expect(screen.getByText(/Quest Island — Loop/)).toBeInTheDocument();
  });

  it('clicking a biome opens the LessonSheet (Start button appears)', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Find and click on a biome area - look for biome labels
    const literacyBiome = screen.getByText('Literacy');
    
    // Click on the biome to open lesson sheet
    await user.click(literacyBiome);
    
    // Should see Start buttons in the lesson sheet
    const startButtons = screen.getAllByText('Start');
    expect(startButtons.length).toBeGreaterThan(0);
  });

  it('pressing Escape or clicking backdrop closes the sheet (no Start button)', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Open a lesson sheet first by clicking a biome
    const literacyBiome = screen.getByText('Literacy');
    await user.click(literacyBiome);
    
    // Verify Start button is present
    expect(screen.getAllByText('Start').length).toBeGreaterThan(0);
    
    // Press Escape to close
    await user.keyboard('{Escape}');
    
    // Start buttons should be gone
    expect(screen.queryByText('Start')).not.toBeInTheDocument();
  });
});
import React from 'react';
import { render, screen } from '@testing-library/react';
import MapComponent from '../components/MapComponent';

describe('MapComponent', () => {
  test('renders without crashing', () => {
    render(<MapComponent mapType="interactive" />);
    expect(screen.getByText('🔺 Polygon')).toBeInTheDocument();
    expect(screen.getByText('📏 Line')).toBeInTheDocument();
    expect(screen.getByText('📍 Marker')).toBeInTheDocument();
    expect(screen.getByText('📐 Measure')).toBeInTheDocument();
    expect(screen.getByText('🗑️ Clear All')).toBeInTheDocument();
  });

  test('shows toolbar with all drawing tools', () => {
    render(<MapComponent mapType="interactive" />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5); // 5 toolbar buttons
  });

  test('renders map container', () => {
    render(<MapComponent mapType="interactive" />);
    const mapContainer = document.querySelector('.leaflet-container');
    expect(mapContainer).toBeInTheDocument();
  });
});
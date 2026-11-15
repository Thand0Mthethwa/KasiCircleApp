import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MarketplaceMap from './MarketplaceMap';
import { hasPublicBusinessCoordinates } from '../models/mapLocation';
import { toProvider } from '../models/provider';

const business = toProvider('business', { id: 'one', name: 'Public Test Shop', category: 'Retail', address: 'Approved business address', city: 'Soweto', province: 'Gauteng', latitude: -26.23, longitude: 27.87 });
function setup(businesses = [business], props = {}) {
  return render(<MemoryRouter><Routes><Route path="/" element={<MarketplaceMap businesses={businesses} {...props} />} /><Route path="/businesses/:id" element={<h1>Business destination</h1>} /></Routes></MemoryRouter>);
}
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(400);
});
afterEach(() => vi.restoreAllMocks());

describe('public business coordinates', () => {
  it.each([[0, 0], [-90, -180], [90, 180], [-26.23, 27.87]])('accepts finite numeric coordinates %s, %s', (latitude, longitude) => {
    expect(hasPublicBusinessCoordinates({ type: 'business', latitude, longitude })).toBe(true);
  });
  it.each([[null, 0], [0, undefined], ['', 0], ['-26.23', 27.87], [false, 0], [NaN, 1], [1, Infinity], [-Infinity, 1], [90.01, 0], [-90.01, 0], [0, 180.01], [0, -180.01]])('rejects invalid coordinates %s, %s', (latitude, longitude) => {
    expect(hasPublicBusinessCoordinates({ type: 'business', latitude, longitude })).toBe(false);
  });
  it('excludes all worker coordinates, addresses and unapproved private fields from the provider model', () => {
    const worker = toProvider('worker', { id: 'private', latitude: -26, longitude: 28, address: 'Private home', privateLatitude: -25, skills: [], serviceCategories: [] });
    expect(worker).not.toHaveProperty('latitude');expect(worker).not.toHaveProperty('longitude');expect(worker).not.toHaveProperty('address');expect(worker).not.toHaveProperty('privateLatitude');
    expect(hasPublicBusinessCoordinates({ ...worker, latitude: -26, longitude: 28 })).toBe(false);
  });
});

describe('interactive Leaflet map', () => {
  it('renders only eligible markers with Vite asset URLs, a readable popup and existing detail navigation', async () => {
    const user = userEvent.setup();
    setup([business, { ...business, id: 'invalid', latitude: 91 }, { ...business, id: 'missing', latitude: null }, { ...business, id: 'worker', type: 'worker' }]);
    const marker = await screen.findByRole('button', { name: 'Location of Public Test Shop' });
    expect(document.querySelectorAll('.leaflet-marker-icon')).toHaveLength(1);
    expect(marker).toHaveAttribute('src', expect.stringContaining('marker-icon.png'));
    expect(screen.getByText(/Showing 1 business pin from the current business page/)).toBeVisible();
    marker.focus();fireEvent.keyPress(marker, { key: 'Enter', code: 'Enter', keyCode: 13, charCode: 13 });
    expect(await screen.findByText('Approved business address, Soweto, Gauteng')).toBeVisible();
    expect(screen.getByText('Retail')).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'View details for Public Test Shop' }));
    expect(await screen.findByRole('heading', { name: 'Business destination' })).toBeVisible();
  });
  it('provides an honest missing-coordinate message, non-personal default map and list recovery', async () => {
    const onListView = vi.fn();setup([{ ...business, latitude: undefined, longitude: undefined }], { onListView });
    expect(screen.getByText('Precise business locations are not available on this page yet.')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Interactive business locations map' })).toBeVisible();
    expect(document.querySelectorAll('.leaflet-marker-icon')).toHaveLength(0);
    expect(screen.getByRole('link', { name: 'OpenStreetMap' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Browse List View' }));expect(onListView).toHaveBeenCalledOnce();
  });
  it('updates markers and current-page scope when the loaded business page changes', () => {
    const view = render(<MemoryRouter><MarketplaceMap businesses={[business]} page={0} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Location of Public Test Shop' })).toBeVisible();
    view.rerender(<MemoryRouter><MarketplaceMap businesses={[{ ...business, id: 'two', key: 'business:two', name: 'Next Page Shop', latitude: -25.7 }]} page={1} /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: 'Location of Public Test Shop' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Location of Next Page Shop' })).toBeVisible();
    expect(screen.getByText(/current business page \(page 2\)/)).toBeVisible();
  });
  it('reports failed tiles, permits retry without cache-busting and retains markers and list access', async () => {
    setup();const firstTile = document.querySelector('.leaflet-tile');expect(firstTile).not.toBeNull();
    const firstUrl = firstTile.src;fireEvent.error(firstTile);
    expect(await screen.findByRole('alert')).toHaveTextContent('Some map tiles could not load');
    expect(screen.getByRole('button', { name: 'Location of Public Test Shop' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Retry map tiles' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(document.querySelector('.leaflet-tile').src).toBe(firstUrl);
    expect(document.querySelector('.leaflet-tile').referrerPolicy).toBe('strict-origin-when-cross-origin');
  });
  it('provides keyboard focus and working zoom controls without map animation', async () => {
    setup();const map = screen.getByRole('region', { name: 'Interactive business locations map' });
    expect(map).toHaveAttribute('tabindex', '0');
    const pane = document.querySelector('.leaflet-map-pane');const before = pane.style.transform || pane.style.left;
    map.focus();fireEvent.keyDown(map, { key: 'ArrowRight' });
    expect(pane.style.transform || pane.style.left).not.toBe(before);
    fireEvent.keyDown(map, { key: 'ArrowLeft' });
    const zoom = screen.getByRole('button', { name: 'Zoom in' });
    zoom.focus();expect(zoom).toHaveFocus();await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Location of Public Test Shop' })).toBeVisible();
    expect(map).not.toHaveClass('leaflet-fade-anim');
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeVisible();
  });
});

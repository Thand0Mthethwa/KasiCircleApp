import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Explore from './Explore';
import { businessService, workerService } from '../services/api';
vi.mock('../services/api', () => ({ businessService: { getAllBusinesses: vi.fn() }, workerService: { getWorkers: vi.fn() } }));
// Routing integration tests isolate map rendering; the map component tests use actual Leaflet.
vi.mock('../components/MarketplaceMap', () => ({ default: ({ businesses, page, onListView }) => <section aria-label="Business map fixture"><p>Current loaded business page {page + 1}</p>{businesses.map(item => <span key={item.id}>{item.name}</span>)}<button onClick={onListView}>Browse List View</button></section> }));
const business = { id: 'map-shop', name: 'Map Test Shop', category: 'Retail', city: 'Soweto', latitude: -26.2, longitude: 27.8 };
const worker = { id: 'map-worker', displayName: 'Public Worker', headline: 'Repairs', skills: [], serviceCategories: [], address: 'Private home', latitude: -26, longitude: 28 };
const pageOf = (content, totalElements = content.length, totalPages = 1) => ({ content, totalElements, totalPages });
function Location() { const location = useLocation();const navigate = useNavigate();return <><output data-testid="location">{location.search}</output><button onClick={() => navigate(-1)}>Browser back</button><button onClick={() => navigate(1)}>Browser forward</button></>; }
function setup(path = '/explore') { return render(<MemoryRouter initialEntries={[path]}><Explore /><Location /></MemoryRouter>); }
beforeEach(() => { vi.resetAllMocks();businessService.getAllBusinesses.mockResolvedValue(pageOf([business], 17, 3));workerService.getWorkers.mockResolvedValue(pageOf([worker], 9, 2)); });
describe('marketplace List / Map integration', () => {
  it.each(['/explore', '/explore?view=invalid'])('defaults safely to List View at %s', async path => {
    setup(path);expect(await screen.findByTestId('business-card-map-shop')).toBeVisible();
    expect(screen.getByRole('button', { name: 'List View', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('region', { name: 'Business map fixture' })).not.toBeInTheDocument();
  });
  it('switches views by keyboard, retains applied and draft search filters, and avoids refetching unchanged pages', async () => {
    const user = userEvent.setup();setup('/explore?search=shop&city=Soweto&category=Retail');await screen.findByTestId('business-card-map-shop');
    await user.type(screen.getByRole('searchbox'), ' draft');
    const businessCalls = businessService.getAllBusinesses.mock.calls.length, workerCalls = workerService.getWorkers.mock.calls.length;
    screen.getByRole('button', { name: 'Map View', exact: true }).focus();await user.keyboard('{Enter}');
    expect(await screen.findByRole('region', { name: 'Business map fixture' })).toBeVisible();
    expect(screen.getByRole('searchbox')).toHaveValue('shop draft');expect(screen.getByLabelText('Filter by township or city')).toHaveValue('Soweto');
    const url = screen.getByTestId('location').textContent;expect(url).toContain('view=map');expect(url).toContain('category=Retail');expect(url).toContain('search=shop');
    expect(businessService.getAllBusinesses).toHaveBeenCalledTimes(businessCalls);expect(workerService.getWorkers).toHaveBeenCalledTimes(workerCalls);
    await user.click(screen.getByRole('button', { name: 'Browse List View' }));expect(await screen.findByTestId('business-card-map-shop')).toBeVisible();
    expect(screen.getByRole('searchbox')).toHaveValue('shop draft');
  });
  it('preserves URL back/forward view navigation and deep-linked independent pages', async () => {
    const user = userEvent.setup();setup('/explore?view=map&businessPage=2&workerPage=2');await screen.findByRole('region', { name: 'Business map fixture' });
    expect(screen.getByText('Current loaded business page 2')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'List View', exact: true }));await screen.findByTestId('business-card-map-shop');
    await user.click(screen.getByRole('button', { name: 'Browser back' }));expect(await screen.findByRole('region', { name: 'Business map fixture' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Browser forward' }));expect(await screen.findByTestId('business-card-map-shop')).toBeVisible();
  });
  it('uses only the loaded page, preserves independent totals and updates that page without requesting unlimited results', async () => {
    const user = userEvent.setup();setup('/explore?view=map');await screen.findByRole('region', { name: 'Business map fixture' });
    expect(screen.getByText('17 businesses listed')).toBeVisible();expect(screen.getByText('9 independent workers listed')).toBeVisible();
    businessService.getAllBusinesses.mockResolvedValueOnce(pageOf([{ ...business, id: 'next', name: 'Next Loaded Shop' }], 17, 3));
    await user.click(within(screen.getByRole('navigation', { name: 'Business pages' })).getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Next Loaded Shop')).toBeVisible();expect(screen.queryByText('Map Test Shop')).not.toBeInTheDocument();
    expect(businessService.getAllBusinesses).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, size: 8 }));
    expect(workerService.getWorkers).toHaveBeenCalledTimes(1);
  });
  it('keeps workers discoverable in All and Workers views and never passes them to the business map', async () => {
    const user = userEvent.setup();setup('/explore?view=map');const map = await screen.findByRole('region', { name: 'Business map fixture' });
    expect(within(map).queryByText('Public Worker')).not.toBeInTheDocument();expect(await screen.findByTestId('worker-card-map-worker')).toBeVisible();
    await user.click(screen.getByRole('tab', { name: 'Workers', exact: true }));await waitFor(() => expect(screen.queryByRole('region', { name: 'Business map fixture' })).not.toBeInTheDocument());
    expect(screen.getByText(/Worker locations are private/)).toBeVisible();expect(screen.getByTestId('worker-card-map-worker')).toBeVisible();expect(screen.queryByText('Private home')).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Businesses', exact: true }));await waitFor(() => expect(screen.getByRole('region', { name: 'Business map fixture' })).toBeVisible());
    expect(screen.queryByTestId('worker-card-map-worker')).not.toBeInTheDocument();
  });
  it('keeps API errors and retry independent while Map View is selected', async () => {
    businessService.getAllBusinesses.mockRejectedValueOnce(new Error('Business directory unavailable'));
    const user = userEvent.setup();setup('/explore?view=map');expect(await screen.findByRole('alert')).toHaveTextContent('Business directory unavailable');
    expect(await screen.findByTestId('worker-card-map-worker')).toBeVisible();expect(screen.queryByRole('region', { name: 'Business map fixture' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));expect(await screen.findByRole('region', { name: 'Business map fixture' })).toBeVisible();
  });
});

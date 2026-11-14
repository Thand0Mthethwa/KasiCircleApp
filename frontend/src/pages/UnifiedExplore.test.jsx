import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Explore from './Explore';
import { businessService, workerService } from '../services/api';
import { toProvider } from '../models/provider';

vi.mock('../services/api', () => ({
  businessService: { getAllBusinesses: vi.fn() }, workerService: { getWorkers: vi.fn() },
}));
const business = { id: 'same-id', name: 'Neighbour Plumbing', category: 'Professional Services', city: 'Soweto', province: 'Gauteng', coverImageUrl: 'https://images.example.test/shop.webp', averageRating: 4.5, reviewCount: 2 };
const worker = { id: 'same-id', displayName: 'Public Plumber', headline: 'Independent plumbing repairs', bio: 'Repairs and maintenance.', skills: ['Plumbing'], serviceCategories: ['Repairs'], city: 'Soweto', province: 'Gauteng', email: 'private@example.test', phoneNumber: 'private-phone', isVerified: true, averageRating: 5 };
const pageOf = (content, totalElements = content.length, totalPages = content.length ? 1 : 0) => ({ content, totalElements, totalPages });
function Location() {
  const location = useLocation(); const navigate = useNavigate();
  return <><output data-testid="location">{location.pathname}{location.search}</output><button onClick={() => navigate(-1)}>Browser back</button><button onClick={() => navigate(1)}>Browser forward</button></>;
}
function setup(path = '/explore') {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/explore" element={<Explore />} /><Route path="/businesses" element={<Explore />} />
    <Route path="/businesses/:id" element={<h1>Business destination</h1>} />
    <Route path="/workers/:id" element={<h1>Worker destination</h1>} />
  </Routes><Location /></MemoryRouter>);
}
async function ready() { await screen.findByTestId('business-card-same-id'); await screen.findByTestId('worker-card-same-id'); }

describe('Unified public marketplace', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    businessService.getAllBusinesses.mockResolvedValue(pageOf([business]));
    workerService.getWorkers.mockResolvedValue(pageOf([worker]));
  });
  it('defaults to All, shows distinct provider labels and accurate independent totals', async () => {
    setup(); await ready();
    expect(screen.getByRole('tab', { name: 'All', exact: true })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Business', { exact: true })).toBeVisible();
    expect(screen.getByText('Independent worker', { exact: true })).toBeVisible();
    expect(screen.getByText('1 business listed')).toBeVisible();
    expect(screen.getByText('1 independent worker listed')).toBeVisible();
    expect(screen.queryByText(/2 providers/)).not.toBeInTheDocument();
    expect(screen.queryByText('private@example.test')).not.toBeInTheDocument();
    expect(screen.queryByText('private-phone')).not.toBeInTheDocument();
    expect(screen.queryByText(/verified/i)).not.toBeInTheDocument();
    expect(within(screen.getByTestId('worker-card-same-id')).queryByText(/reviews|stars|5\.0/)).not.toBeInTheDocument();
  });
  it('uses source-qualified keys and excludes private/unsupported fields from the presentation model', () => {
    const b = toProvider('business', business); const w = toProvider('worker', worker);
    expect(b.key).toBe('business:same-id'); expect(w.key).toBe('worker:same-id');
    expect(w).not.toHaveProperty('email'); expect(w).not.toHaveProperty('phoneNumber');
    expect(w).not.toHaveProperty('isVerified'); expect(w).not.toHaveProperty('averageRating');
  });
  it('searches both APIs by submitted keyword and city and stores the criteria in the URL', async () => {
    const user = userEvent.setup(); setup(); await ready();
    await user.type(screen.getByRole('searchbox', { name: 'Search businesses and workers' }), ' plumber ');
    await user.type(screen.getByLabelText('Filter by township or city'), ' Soweto ');
    await user.click(screen.getByRole('button', { name: 'Search', exact: true }));
    await waitFor(() => expect(businessService.getAllBusinesses).toHaveBeenLastCalledWith({ search: 'plumber', city: 'Soweto', category: '', page: 0, size: 8 }));
    await waitFor(() => expect(workerService.getWorkers).toHaveBeenLastCalledWith({ search: 'plumber', city: 'Soweto', category: '', skill: '', page: 0, size: 8 }));
    expect(screen.getByTestId('location')).toHaveTextContent('/explore?search=plumber&city=Soweto');
  });
  it.each(['businesses', 'workers'])('requests only %s for a direct tab bookmark', async (provider) => {
    setup(`/explore?provider=${provider}&search=plumber&city=Soweto`);
    await screen.findByTestId(provider === 'businesses' ? 'business-card-same-id' : 'worker-card-same-id');
    expect(screen.getByRole('tab', { name: provider === 'businesses' ? 'Businesses' : 'Workers' })).toHaveAttribute('aria-selected', 'true');
    expect(provider === 'businesses' ? workerService.getWorkers : businessService.getAllBusinesses).not.toHaveBeenCalled();
  });
  it('composes a category click and immediate search submission without losing either URL edit', async () => {
    setup(); await ready();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'plumber' } });
    fireEvent.change(screen.getByLabelText('Filter by township or city'), { target: { value: 'Soweto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retail', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Search', exact: true }));
    await waitFor(() => expect(businessService.getAllBusinesses).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'plumber', city: 'Soweto', category: 'Retail' })));
  });
  it('switches all provider views without losing shared criteria', async () => {
    const user = userEvent.setup(); setup('/explore?search=plumber&city=Soweto'); await ready();
    await user.click(screen.getByRole('tab', { name: 'Businesses' }));
    await waitFor(() => expect(screen.queryByTestId('worker-card-same-id')).not.toBeInTheDocument());
    expect(screen.getByTestId('location')).toHaveTextContent('provider=businesses');
    await user.click(screen.getByRole('tab', { name: 'Workers' }));
    await waitFor(() => expect(screen.queryByTestId('business-card-same-id')).not.toBeInTheDocument());
    expect(screen.getByRole('searchbox')).toHaveValue('plumber');
    expect(screen.getByLabelText('Filter by township or city')).toHaveValue('Soweto');
    await user.click(screen.getByRole('tab', { name: 'All', exact: true })); await ready();
  });
  it('supports keyboard tab navigation with visible focus and selection', async () => {
    const user = userEvent.setup(); setup(); await ready();
    screen.getByRole('tab', { name: 'All', exact: true }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Businesses' })).toHaveFocus();
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Businesses' })).toHaveAttribute('aria-selected', 'true'));
    await user.keyboard('{End}'); expect(screen.getByRole('tab', { name: 'Workers' })).toHaveFocus();
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Workers' })).toHaveAttribute('aria-selected', 'true'));
    await user.keyboard('{Home}'); expect(screen.getByRole('tab', { name: 'All', exact: true })).toHaveFocus();
  });
  it.each(['business', 'worker'])('routes the %s with a colliding source ID to its own detail page', async (type) => {
    const user = userEvent.setup(); setup(); await ready();
    await user.click(screen.getByRole('link', { name: type === 'business' ? 'View details for Neighbour Plumbing' : 'View worker profile for Public Plumber' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(type === 'business' ? '/businesses/same-id' : '/workers/same-id'));
  });
  it.each(['business', 'worker'])('keeps healthy results visible when the %s API fails and retries only that API', async (type) => {
    const failing = type === 'business' ? businessService.getAllBusinesses : workerService.getWorkers;
    failing.mockRejectedValueOnce(new Error('Directory temporarily offline'));
    const user = userEvent.setup(); setup();
    expect(await screen.findByRole('alert')).toHaveTextContent('Directory temporarily offline');
    expect(await screen.findByTestId(type === 'business' ? 'worker-card-same-id' : 'business-card-same-id')).toBeVisible();
    const healthy = type === 'business' ? workerService.getWorkers : businessService.getAllBusinesses;
    const calls = healthy.mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'Try again' })); await ready();
    expect(healthy).toHaveBeenCalledTimes(calls);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('distinguishes two failures from empty results', async () => {
    businessService.getAllBusinesses.mockRejectedValue(new Error('Business offline'));
    workerService.getWorkers.mockRejectedValue(new Error('Worker offline'));
    setup(); await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2));
    expect(screen.queryByText('No businesses found')).not.toBeInTheDocument();
    expect(screen.queryByText('No workers found')).not.toBeInTheDocument();
  });
  it('shows explicit independent empty states without invented records or totals', async () => {
    businessService.getAllBusinesses.mockResolvedValue(pageOf([])); workerService.getWorkers.mockResolvedValue(pageOf([]));
    setup(); expect(await screen.findByText('No businesses found')).toBeVisible(); expect(await screen.findByText('No workers found')).toBeVisible();
    expect(screen.getByText('0 businesses listed')).toBeVisible(); expect(screen.getByText('0 independent workers listed')).toBeVisible();
  });
  it('does not imply a global total when a server omits pagination metadata', async () => {
    businessService.getAllBusinesses.mockResolvedValue({ content: [business] }); setup('/businesses');
    expect(await screen.findByText('1 business shown on this page')).toBeVisible();
    expect(screen.queryByText('1 business listed')).not.toBeInTheDocument();
  });
  it('paginates each source independently without dropping the other page or changing source totals', async () => {
    businessService.getAllBusinesses.mockResolvedValue(pageOf([business], 17, 3));
    workerService.getWorkers.mockResolvedValue(pageOf([worker], 9, 2));
    const user = userEvent.setup(); setup(); await ready();
    expect(screen.getByText('17 businesses listed')).toBeVisible(); expect(screen.getByText('9 independent workers listed')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Next page', exact: true }));
    await waitFor(() => expect(businessService.getAllBusinesses).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })));
    expect(workerService.getWorkers).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Next worker page' }));
    await waitFor(() => expect(workerService.getWorkers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })));
    expect(screen.getByTestId('location')).toHaveTextContent('businessPage=2&workerPage=2');
    expect(within(screen.getByRole('navigation', { name: 'Business pages' })).getByText('Page 2 of 3')).toBeVisible();
    await waitFor(() => expect(within(screen.getByRole('navigation', { name: 'Worker pages' })).getByText('Page 2 of 2')).toBeVisible());
  });
  it('scopes business categories and worker skill/category filters to their own APIs', async () => {
    const user = userEvent.setup(); setup(); await ready();
    await user.click(screen.getByRole('button', { name: 'Retail', exact: true }));
    await waitFor(() => expect(businessService.getAllBusinesses).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Retail' })));
    expect(workerService.getWorkers).toHaveBeenCalledTimes(1);
    await user.type(screen.getByLabelText('Worker skill'), 'Plumbing');
    await user.type(screen.getByLabelText('Worker service category'), 'Repairs');
    await user.click(screen.getByRole('button', { name: 'Search', exact: true }));
    await waitFor(() => expect(workerService.getWorkers).toHaveBeenLastCalledWith(expect.objectContaining({ skill: 'Plumbing', category: 'Repairs' })));
    expect(businessService.getAllBusinesses).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Retail' }));
  });
  it('restores committed filters and source pages through browser back/forward navigation', async () => {
    const user = userEvent.setup(); setup('/explore?search=first&city=Soweto'); await ready();
    await user.clear(screen.getByRole('searchbox')); await user.type(screen.getByRole('searchbox'), 'second');
    await user.click(screen.getByRole('button', { name: 'Search', exact: true }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('search=second'));
    await user.click(screen.getByRole('button', { name: 'Browser back' }));
    await waitFor(() => expect(screen.getByRole('searchbox')).toHaveValue('first'));
    await waitFor(() => expect(workerService.getWorkers).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'first' })));
    await user.click(screen.getByRole('button', { name: 'Browser forward' }));
    await waitFor(() => expect(screen.getByRole('searchbox')).toHaveValue('second'));
  });
  it('resets both source filters and pages while retaining the chosen provider view', async () => {
    const user = userEvent.setup(); setup('/explore?provider=workers&search=plumber&city=Soweto&category=Retail&skill=Pipes&workerCategory=Repairs&workerPage=2&businessPage=3');
    await screen.findByTestId('worker-card-same-id');
    await user.click(screen.getByRole('button', { name: 'Reset all filters' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/explore?provider=workers'));
    expect(screen.getByRole('searchbox')).toHaveValue(''); expect(screen.getByLabelText('Worker skill')).toHaveValue('');
    await waitFor(() => expect(workerService.getWorkers).toHaveBeenLastCalledWith({ search: '', city: '', category: '', skill: '', size: 8, page: 0 }));
  });
  it('keeps business bookmarks business-first and allows selecting All explicitly on the legacy route', async () => {
    const user = userEvent.setup(); setup('/businesses?search=plumber&category=Retail&city=Soweto');
    await screen.findByTestId('business-card-same-id'); expect(workerService.getWorkers).not.toHaveBeenCalled();
    expect(screen.getByRole('tab', { name: 'Businesses' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: 'All', exact: true })); await ready();
    expect(screen.getByTestId('location')).toHaveTextContent('provider=all');
    expect(workerService.getWorkers).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'plumber', city: 'Soweto', category: '' }));
  });
  it('ignores stale responses after criteria change and renders a healthy source while the other loads', async () => {
    let release;
    workerService.getWorkers.mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
    setup(); await screen.findByTestId('business-card-same-id');
    expect(screen.getByTestId('worker-loading-state')).toBeVisible();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'new query' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search', exact: true }));
    await screen.findByTestId('worker-card-same-id');
    await act(async () => { release(pageOf([{ ...worker, id: 'old-worker', displayName: 'Stale worker' }])); });
    expect(screen.queryByText('Stale worker')).not.toBeInTheDocument();
  });
  it('rejects malformed pages as errors and provides honest recovery for an out-of-range bookmarked page', async () => {
    workerService.getWorkers.mockResolvedValue({}); businessService.getAllBusinesses.mockResolvedValue(pageOf([], 2, 1));
    setup('/explore?businessPage=5');
    expect(await screen.findByTestId('worker-error-state')).toBeVisible();
    expect(await screen.findByText('Page 5 is outside the current results')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Workers from './Workers';
import { workerService } from '../services/api';

vi.mock('../services/api', () => ({
  workerService: {
    getWorkers: vi.fn(),
  },
}));

function CurrentLocation() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

describe('Workers directory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists public profiles and applies skill, category, and city filters', async () => {
    workerService.getWorkers.mockResolvedValue({
      content: [{
        id: 'profile-1',
        displayName: 'Amahle Dube',
        headline: 'Electrician',
        bio: 'Residential wiring and repairs.',
        skills: ['Wiring'],
        serviceCategories: ['Electrical'],
        city: 'Soweto',
        province: 'Gauteng',
      }],
    });

    render(
      <MemoryRouter initialEntries={['/workers']}>
        <Routes>
          <Route path="/workers" element={<Workers />} />
          <Route path="/workers/:id" element={<div>Public worker profile</div>} />
        </Routes>
        <CurrentLocation />
      </MemoryRouter>
    );

    expect(await screen.findByText('Amahle Dube')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Filter by skill'), { target: { value: 'Wiring' } });
    fireEvent.change(screen.getByLabelText('Filter by service category'), { target: { value: 'Electrical' } });
    fireEvent.change(screen.getByLabelText('Filter workers by city'), { target: { value: 'Soweto' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(workerService.getWorkers).toHaveBeenLastCalledWith(expect.objectContaining({
        skill: 'Wiring',
        category: 'Electrical',
        city: 'Soweto',
      }));
    });

    fireEvent.click(screen.getByRole('button', { name: /Amahle Dube/i }));
    expect(await screen.findByText('Public worker profile')).toBeInTheDocument();
  });

  it('shows an explicit empty state', async () => {
    workerService.getWorkers.mockResolvedValue({ content: [] });
    render(<MemoryRouter><Workers /></MemoryRouter>);

    expect(await screen.findByTestId('worker-empty-state')).toHaveTextContent('No workers match');
  });

  it('shows directory failures instead of a success-shaped empty result', async () => {
    workerService.getWorkers.mockRejectedValue(new Error('Directory unavailable'));
    render(<MemoryRouter><Workers /></MemoryRouter>);

    expect(await screen.findByRole('alert')).toHaveTextContent('Directory unavailable');
  });
  it('loads later profiles, retains filters and resets pagination for a new search', async () => {
    const profile = { id: 'first', displayName: 'First Worker', headline: 'Repairs', bio: 'Local repairs', skills: [], city: 'Soweto', province: 'Gauteng' };
    workerService.getWorkers.mockImplementation(async ({ page }) => ({
      content: [{ ...profile, id: String(page), displayName: page ? 'Later Worker' : 'First Worker' }],
      totalPages: 2,
    }));
    render(<MemoryRouter initialEntries={['/workers?skill=Wiring']}><Workers /></MemoryRouter>);
    expect(await screen.findByText('First Worker')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Later Worker')).toBeInTheDocument();
    expect(workerService.getWorkers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, skill: 'Wiring' }));
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Filter workers by city'), { target: { value: 'Soweto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('First Worker')).toBeInTheDocument();
    expect(workerService.getWorkers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, city: 'Soweto', skill: 'Wiring' }));
  });

});

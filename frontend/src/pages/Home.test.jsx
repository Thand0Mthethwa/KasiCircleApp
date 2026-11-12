import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './Home';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { firstName: 'Amahle' } }),
}));

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{`${pathname}${search}`}</output>;
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/home']}>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="*" element={<p>Marketplace destination</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );
}

describe('Home marketplace navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches the real worker directory and greets the signed-in user', async () => {
    const user = userEvent.setup();
    renderHome();

    expect(screen.getByRole('heading', { name: /Good .* Amahle/i })).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Search workers by name or skill...' }), 'electrician');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/workers?search=electrician'));
  });

  it('links marketplace sections to supported directories without fabricated listings', async () => {
    const user = userEvent.setup();
    renderHome();

    expect(screen.queryByText('1,240+')).not.toBeInTheDocument();
    expect(screen.queryByText('Sipho Dlamini')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Find local jobs' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/jobs'));
  });

  it('opens the worker directory with a selected skill filter', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: 'Plumber' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/workers?skill=Plumber'));
  });
});

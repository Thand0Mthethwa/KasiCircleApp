import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { jobService, userService, workerService } from './services/api';

vi.mock('./services/api', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
  userService: {
    getCurrentUser: vi.fn(),
  },
  jobService: {
    getJobs: vi.fn(),
  },
  workerService: {
    getWorkers: vi.fn(),
    getWorkerById: vi.fn(),
    getMyProfile: vi.fn(),
    createMyProfile: vi.fn(),
    updateMyProfile: vi.fn(),
  },
}));

vi.mock('./pages/Explore', () => ({
  default: () => <div>Explore route</div>,
}));

vi.mock('./pages/Welcome', () => ({
  default: () => <div>Welcome route</div>,
}));

describe('App session expiry routing', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('redirects an authenticated visitor to welcome when the session expires', async () => {
    localStorage.setItem('kasicircle_token', 'active-token');
    userService.getCurrentUser.mockResolvedValue({
      id: 'user-1',
      firstName: 'Jane',
    });

    render(
      <MemoryRouter initialEntries={['/explore']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Explore route')).toBeInTheDocument();

    fireEvent(window, new Event('kasicircle:unauthorized'));

    await waitFor(() => {
      expect(screen.getByText('Welcome route')).toBeInTheDocument();
    });
  });

  it('allows unauthenticated visitors to browse public jobs', async () => {
    jobService.getJobs.mockResolvedValue({ content: [], totalPages: 0 });

    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Find jobs')).toBeInTheDocument();
    expect(await screen.findByTestId('job-empty-state')).toBeInTheDocument();
  });

  it('exposes the public worker directory route to unauthenticated visitors', async () => {
    workerService.getWorkers.mockResolvedValue({ content: [] });

    render(
      <MemoryRouter initialEntries={['/workers']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('worker-empty-state')).toBeInTheDocument();
  });
});

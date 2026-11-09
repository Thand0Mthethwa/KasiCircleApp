import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { userService } from './services/api';

vi.mock('./services/api', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
  userService: {
    getCurrentUser: vi.fn(),
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
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

describe('messaging application route', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('loads the protected conversations screen for an authenticated user', async () => {
    localStorage.setItem('kasicircle_token', 'access-token');
    localStorage.setItem('kasicircle_user', JSON.stringify({
      id: 'user-1',
      firstName: 'Current',
      lastName: 'User',
    }));
    const fetchMock = vi.fn().mockImplementation((url) => {
      const body = url.includes('/api/users/me')
        ? { id: 'user-1', firstName: 'Current', lastName: 'User', accountType: 'RESIDENT' }
        : [];
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => body,
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/messages']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('conversation-empty-state')).toHaveTextContent('No conversations yet');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/conversations'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      })
    );
  });
});

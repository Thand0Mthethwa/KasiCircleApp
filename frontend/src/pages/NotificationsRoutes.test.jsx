import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

describe('notification application route', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('loads the protected notification screen for an authenticated user', async () => {
    localStorage.setItem('kasicircle_token', 'access-token');
    localStorage.setItem('kasicircle_user', JSON.stringify({
      id: 'user-1',
      firstName: 'Current',
      lastName: 'User',
    }));
    const fetchMock = vi.fn().mockImplementation((url) => {
      let body = [];
      if (url.includes('/api/users/me')) {
        body = { id: 'user-1', firstName: 'Current', lastName: 'User', accountType: 'RESIDENT' };
      } else if (url.includes('/api/notifications/unread-count')) {
        body = { count: 0 };
      } else if (url.includes('/api/notifications')) {
        body = { content: [], totalPages: 0 };
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => body,
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/notifications']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('notifications-empty-state')).toHaveTextContent('No notifications yet');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications?page=0&size=20'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      })
    );
  });
});

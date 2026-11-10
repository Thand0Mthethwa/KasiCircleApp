import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

describe('admin moderation route', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  const renderWithUser = async (role) => {
    localStorage.setItem('kasicircle_token', 'access-token');
    localStorage.setItem('kasicircle_user', JSON.stringify({
      id: 'user-1',
      firstName: 'Test',
      lastName: 'User',
      role,
    }));
    const fetchMock = vi.fn().mockImplementation((url) => {
      const body = url.includes('/api/users/me')
        ? { id: 'user-1', firstName: 'Test', lastName: 'User', role }
        : { content: [], totalPages: 0 };
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => body,
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<MemoryRouter initialEntries={['/admin/reports']}><App /></MemoryRouter>);
    return fetchMock;
  };

  it('loads the reports screen for an authenticated administrator', async () => {
    const fetchMock = await renderWithUser('ADMIN');

    expect(await screen.findByTestId('reports-empty-state')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/reports?page=0&size=20'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('redirects authenticated non-admins away from moderation', async () => {
    const fetchMock = await renderWithUser('USER');

    expect(await screen.findByText(/Good (morning|afternoon|evening)/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/reports'),
      expect.anything()
    );
  });
});

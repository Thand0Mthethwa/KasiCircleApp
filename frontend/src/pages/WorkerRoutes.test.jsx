import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

describe('worker directory route integration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the public worker directory through the application route', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ content: [], totalPages: 0 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/workers']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('worker-empty-state')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/workers?page=0&size=20'),
      expect.objectContaining({ method: 'GET' })
    );
  });
});

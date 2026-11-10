import { afterEach, describe, expect, it, vi } from 'vitest';
import { workerService } from './api';

describe('workerService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends public directory filters without an authorization header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ content: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await workerService.getWorkers({
      search: ' Electrician ',
      category: 'Electrical',
      skill: 'Wiring',
      city: 'Soweto',
      page: 1,
      size: 20,
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain(
      '/api/workers?page=1&size=20&search=Electrician&category=Electrical&skill=Wiring&city=Soweto'
    );
    expect(options.headers.Authorization).toBeUndefined();
  });
});

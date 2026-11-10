import { afterEach, describe, expect, it, vi } from 'vitest';
import { jobService } from './api';

describe('jobService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('sends public job filters without an authorization header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ content: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await jobService.getJobs({
      search: ' Electrician ',
      category: 'Electrical',
      city: 'Soweto',
      page: 1,
      size: 10,
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain(
      '/api/jobs?page=1&size=10&status=OPEN&search=Electrician&category=Electrical&city=Soweto'
    );
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('authenticates job applications and serializes the message', async () => {
    localStorage.setItem('kasicircle_token', 'access-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: { get: () => 'application/json' },
      json: async () => ({ id: 'application-1' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await jobService.applyForJob('job-1', 'I have relevant experience.');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/jobs/job-1/applications'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
        body: JSON.stringify({ message: 'I have relevant experience.' }),
      })
    );
  });
});

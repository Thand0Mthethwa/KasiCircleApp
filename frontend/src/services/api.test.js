import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { businessService, userService, workerService } from './api';

const response = (status, data) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => 'application/json' },
  json: vi.fn().mockResolvedValue(data),
});

describe('API session handling', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('clears the session and emits an unauthorized event for authenticated 401 responses', async () => {
    localStorage.setItem('kasicircle_token', 'expired-token');
    localStorage.setItem('kasicircle_user', JSON.stringify({ id: 'user-1' }));
    const unauthorizedListener = vi.fn();
    window.addEventListener('kasicircle:unauthorized', unauthorizedListener);
    fetch.mockResolvedValueOnce(response(401, { message: 'Authentication required.' }));

    await expect(userService.getCurrentUser()).rejects.toMatchObject({
      status: 401,
      message: 'Authentication required.',
    });

    expect(localStorage.getItem('kasicircle_token')).toBeNull();
    expect(localStorage.getItem('kasicircle_user')).toBeNull();
    expect(unauthorizedListener).toHaveBeenCalledOnce();
    window.removeEventListener('kasicircle:unauthorized', unauthorizedListener);
  });

  it('does not clear the session for public business requests returning 401', async () => {
    localStorage.setItem('kasicircle_token', 'active-token');
    const unauthorizedListener = vi.fn();
    window.addEventListener('kasicircle:unauthorized', unauthorizedListener);
    fetch.mockResolvedValueOnce(response(401, { message: 'Not available.' }));

    await expect(businessService.getBusinessById('business-1')).rejects.toMatchObject({
      status: 401,
    });

    expect(localStorage.getItem('kasicircle_token')).toBe('active-token');
    expect(unauthorizedListener).not.toHaveBeenCalled();
    window.removeEventListener('kasicircle:unauthorized', unauthorizedListener);
  });

  it('requests the public worker directory with filters and without an authorization header', async () => {
    localStorage.setItem('kasicircle_token', 'active-token');
    fetch.mockResolvedValueOnce(response(200, { content: [] }));

    await workerService.getWorkers({ search: 'Amahle', skill: 'Wiring', category: 'Electrical', city: 'Soweto' });

    const [url, options] = fetch.mock.calls[0];
    expect(url).toContain('/api/workers?');
    expect(url).toContain('search=Amahle');
    expect(url).toContain('skill=Wiring');
    expect(url).toContain('category=Electrical');
    expect(url).toContain('city=Soweto');
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('sends authenticated worker profile updates', async () => {
    localStorage.setItem('kasicircle_token', 'worker-token');
    fetch.mockResolvedValueOnce(response(200, { headline: 'Electrician' }));
    const profile = {
      headline: 'Electrician',
      bio: 'Home wiring',
      skills: ['Wiring'],
      serviceCategories: ['Electrical'],
      city: 'Soweto',
      province: 'Gauteng',
    };

    await workerService.updateMyProfile(profile);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/workers/me'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ Authorization: 'Bearer worker-token' }),
        body: JSON.stringify(profile),
      })
    );
  });
});

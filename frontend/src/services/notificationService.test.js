import { afterEach, describe, expect, it, vi } from 'vitest';
import { notificationService } from './api';

describe('notificationService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('sends authenticated requests for unread counts and read updates', async () => {
    localStorage.setItem('kasicircle_token', 'access-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ count: 2 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await notificationService.getUnreadCount();
    await notificationService.markAsRead('notification-1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/api/notifications/unread-count'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/notifications/notification-1/read'),
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      })
    );
  });
});

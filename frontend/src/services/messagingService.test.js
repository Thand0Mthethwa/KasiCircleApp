import { afterEach, describe, expect, it, vi } from 'vitest';
import { messagingService } from './api';

describe('messagingService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('authenticates conversation requests and posts only the participant id', async () => {
    localStorage.setItem('kasicircle_token', 'access-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: { get: () => 'application/json' },
      json: async () => ({ id: 'conversation-1' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await messagingService.createConversation('participant-1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/conversations'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
        body: JSON.stringify({ participantId: 'participant-1' }),
      })
    );
  });

  it('requests the newest conversation history first', async () => {
    localStorage.setItem('kasicircle_token', 'access-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ content: [], totalPages: 0 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await messagingService.getMessages('conversation-1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/conversations/conversation-1/messages?page=0&size=50&sort=createdAt%2Cdesc'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      })
    );
  });
});

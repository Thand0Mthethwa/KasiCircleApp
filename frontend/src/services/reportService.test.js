import { afterEach, describe, expect, it, vi } from 'vitest';
import { reportService } from './api';

describe('reportService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('authenticates report submissions and moderation requests', async () => {
    localStorage.setItem('kasicircle_token', 'access-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: { get: () => 'application/json' },
      json: async () => ({ id: 'report-1' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await reportService.createReport({
      targetType: 'JOB',
      targetId: 'job-1',
      reason: 'SPAM',
    });
    await reportService.moderateReport('report-1', { status: 'DISMISSED' });

    const [submissionUrl, submissionOptions] = fetchMock.mock.calls[0];
    expect(submissionUrl).toContain('/api/reports');
    expect(submissionOptions.method).toBe('POST');
    expect(submissionOptions.headers.Authorization).toEqual(expect.any(String));
    expect(JSON.parse(submissionOptions.body)).toEqual({
      targetType: 'JOB',
      targetId: 'job-1',
      reason: 'SPAM',
    });

    const [moderationUrl, moderationOptions] = fetchMock.mock.calls[1];
    expect(moderationUrl).toContain('/api/reports/report-1/moderation');
    expect(moderationOptions.method).toBe('PATCH');
    expect(moderationOptions.headers.Authorization).toEqual(expect.any(String));
  });
});

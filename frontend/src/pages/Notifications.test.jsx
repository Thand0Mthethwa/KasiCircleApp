import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Notifications from './Notifications';
import { notificationService } from '../services/api';

vi.mock('../services/api', () => ({
  notificationService: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
  },
}));

const notification = {
  id: 'notification-1',
  type: 'JOB_APPLICATION',
  title: 'New job application',
  message: 'A resident applied to Electrician.',
  resourceType: 'JOB',
  resourceId: 'job-1',
  createdAt: '2026-01-01T10:00:00Z',
  readAt: null,
};

describe('Notifications page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationService.getNotifications.mockResolvedValue({
      content: [notification],
      totalPages: 1,
    });
    notificationService.getUnreadCount.mockResolvedValue({ count: 1 });
    notificationService.markAsRead.mockResolvedValue({
      ...notification,
      readAt: '2026-01-01T11:00:00Z',
    });
  });

  it('shows unread counts and marks a notification read before navigating to its resource', async () => {
    render(
      <MemoryRouter initialEntries={['/notifications']}>
        <Routes>
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/jobs/:id" element={<p>Job notification destination</p>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Unread notifications:')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /New job application/i }));

    expect(await screen.findByText('Job notification destination')).toBeInTheDocument();
    expect(notificationService.markAsRead).toHaveBeenCalledWith('notification-1');
  });

  it('shows an explicit empty state', async () => {
    notificationService.getNotifications.mockResolvedValue({ content: [], totalPages: 0 });
    notificationService.getUnreadCount.mockResolvedValue({ count: 0 });
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('notifications-empty-state')).toHaveTextContent('No notifications yet');
  });

  it('reports notification loading failures', async () => {
    notificationService.getNotifications.mockRejectedValue(new Error('Notifications unavailable'));
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Notifications unavailable');
  });
});

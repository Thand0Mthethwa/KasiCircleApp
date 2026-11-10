import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Bell, CheckCircle2 } from 'lucide-react';
import { Button, Card, Header, LoadingSpinner } from '../components';
import { notificationService } from '../services/api';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [markingId, setMarkingId] = useState('');
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [result, unread] = await Promise.all([
        notificationService.getNotifications(page, 20),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(result.content || []);
      setTotalPages(result.totalPages || 0);
      setUnreadCount(unread.count);
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'Unable to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const openNotification = async (notification) => {
    setError('');
    if (!notification.readAt) {
      setMarkingId(notification.id);
      try {
        const updatedNotification = await notificationService.markAsRead(notification.id);
        setNotifications((current) => current.map((item) =>
          item.id === notification.id ? updatedNotification : item));
        setUnreadCount((current) => Math.max(0, current - 1));
      } catch (requestError) {
        setError(requestError.data?.message || requestError.message || 'Unable to mark this notification as read.');
        setMarkingId('');
        return;
      }
      setMarkingId('');
    }

    if (notification.resourceType === 'JOB') {
      navigate(`/jobs/${notification.resourceId}`);
    } else if (notification.resourceType === 'CONVERSATION') {
      navigate(`/messages?conversation=${notification.resourceId}`);
    } else {
      setError('This notification does not have a supported destination.');
    }
  };

  return (
    <div className="page-wrapper pb-8">
      <Header title="Notifications" onBack={() => navigate(-1)} />
      <main className="page-content page-padding py-6 max-w-3xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm text-neutral-600" aria-live="polite">
            <Bell size={16} />Unread notifications: <strong>{unreadCount}</strong>
          </p>
        </div>
        {error && <Card className="p-4 text-red-700" role="alert"><AlertCircle className="mr-2 inline" />{error}</Card>}
        {isLoading ? (
          <div role="status" className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : notifications.length ? (
          <>
            <section aria-label="Your notifications" className="space-y-3">
              {notifications.map((notification) => (
                <Card key={notification.id} className={`overflow-hidden ${notification.readAt ? '' : 'border-kasi-green'}`}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 p-4 text-left hover:bg-neutral-50"
                    onClick={() => openNotification(notification)}
                    disabled={markingId === notification.id}
                    aria-label={`${notification.readAt ? 'Open' : 'Unread'} notification: ${notification.title}`}
                  >
                    {notification.readAt
                      ? <CheckCircle2 size={18} className="mt-1 shrink-0 text-neutral-400" />
                      : <Bell size={18} className="mt-1 shrink-0 text-kasi-green" />}
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{notification.title}</span>
                      <span className="mt-1 block text-sm text-neutral-700">{notification.message}</span>
                      <time className="mt-2 block text-xs text-neutral-500" dateTime={notification.createdAt}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </time>
                    </span>
                    {markingId === notification.id && <span className="text-sm text-neutral-500">Opening…</span>}
                  </button>
                </Card>
              ))}
            </section>
            {totalPages > 1 && (
              <nav className="flex items-center justify-between" aria-label="Notification pages">
                <Button type="button" variant="secondary" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                <span aria-live="polite">Page {page + 1} of {totalPages}</span>
                <Button type="button" variant="secondary" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
              </nav>
            )}
          </>
        ) : (
          <Card className="p-8 text-center text-neutral-600" data-testid="notifications-empty-state">
            <Bell className="mx-auto mb-2" />
            <p>You are all caught up. No notifications yet.</p>
          </Card>
        )}
      </main>
    </div>
  );
}

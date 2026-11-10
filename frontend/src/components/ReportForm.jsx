import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from './index';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../services/api';

const reasons = ['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'FRAUD', 'OTHER'];

export default function ReportForm({ targetType, targetId }) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('INAPPROPRIATE');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submitReport = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);
    try {
      await reportService.createReport({
        targetType,
        targetId,
        reason,
        details: details.trim() || null,
      });
      setNotice('Thank you. Your report has been submitted for review.');
      setDetails('');
      setIsOpen(false);
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'Unable to submit your report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mt-4">
        {!isOpen ? (
          <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>Report this content</Button>
        ) : (
          <p className="text-sm text-neutral-600">
            <Link className="underline text-kasi-green" to="/login">Sign in</Link> to report this content.
            <Button type="button" variant="secondary" className="ml-3" onClick={() => setIsOpen(false)}>Cancel</Button>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-5">
      {notice && <p role="status" className="mb-3 text-sm text-green-700">{notice}</p>}
      {!isOpen ? (
        <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>Report this content</Button>
      ) : (
        <Card className="p-4">
          <form onSubmit={submitReport} className="space-y-3">
            <h2 className="font-semibold">Report this content</h2>
            <label className="block text-sm font-medium">
              Reason
              <select
                className="input-field mt-1"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={isSubmitting}
              >
                {reasons.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ').toLowerCase()}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Details (optional)
              <textarea
                className="input-field mt-1 min-h-24"
                maxLength={1000}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                disabled={isSubmitting}
              />
            </label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit report'}
              </Button>
              <Button type="button" variant="secondary" disabled={isSubmitting} onClick={() => setIsOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

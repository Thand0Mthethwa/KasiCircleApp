import { useState } from 'react';
import { Button, Card, Header } from '..';
import { statusLabels } from './commerce';

export const fieldStyle = 'w-full min-w-0 rounded-lg border border-neutral-300 bg-white p-3 text-neutral-900';

export function CommercePage({ title, children }) {
  return (
    <div className="page-wrapper pb-8">
      <Header title={title} />
      <main className="content-container max-w-3xl space-y-5 py-6">{children}</main>
    </div>
  );
}

export function ResourceFeedback({ resource }) {
  if (resource.loading) return <p role="status">Loading…</p>;
  if (!resource.error) return null;
  return (
    <div className="space-y-2">
      <p role="alert">{resource.error.message}</p>
      <Button type="button" variant="secondary" onClick={resource.retry}>Try again</Button>
    </div>
  );
}

export function Pagination({ page, totalPages, setPage }) {
  if (page === 0 && totalPages <= 1) return null;
  return (
    <nav aria-label="Pages" className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
      <Button type="button" variant="secondary" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
    </nav>
  );
}

export function Field({ label, multiline = false, children, ...props }) {
  return (
    <label className="grid min-w-0 gap-1 font-medium">
      {label}
      {children || (multiline
        ? <textarea className={fieldStyle} rows={3} {...props} />
        : <input className={fieldStyle} {...props} />)}
    </label>
  );
}

export function BookingStatus({ status }) {
  return (
    <span className="inline-block rounded-full bg-kasi-green-light px-3 py-1 text-sm font-semibold text-kasi-green">
      {statusLabels[status]}
    </span>
  );
}

export function useCommerceMutation() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function run(operation) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await operation();
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, run };
}

export function PaymentNote() {
  return (
    <Card className="p-4">
      <h2 className="font-semibold">Payment outside KasiCircle</h2>
      <p className="text-sm text-neutral-700">Customers and providers arrange payment directly. Payment is separate from your booking request.</p>
    </Card>
  );
}

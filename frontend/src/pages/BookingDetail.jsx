import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card } from '../components';
import { BookingStatus, CommercePage, Field, ResourceFeedback, useCommerceMutation } from '../components/commerce/CommerceUI';
import PaymentPanel from '../components/commerce/PaymentPanel';
import { bookingTime, rand, sastInput, sastInstant } from '../components/commerce/commerce';
import useCommerceResource from '../components/commerce/useCommerceResource';
import { commerceService } from '../services/api';

function BookingActions({ booking, reload }) {
  const [proposing, setProposing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const mutation = useCommerceMutation();
  const { status, viewer } = booking;
  const provider = viewer === 'PROVIDER';
  const customer = viewer === 'CUSTOMER';
  const open = status === 'REQUESTED' || status === 'PROPOSED';
  const canCancel = (provider || customer) && (open || status === 'ACCEPTED');

  function change(action, proposal = {}) {
    mutation.run(async () => {
      await commerceService.change(booking.id, { action, revision: booking.revision, ...proposal });
      reload();
    });
  }

  function propose(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    change('PROPOSE', {
      proposedAt: sastInstant(data.get('proposedAt')),
      proposedPrice: data.get('proposedPrice'),
    });
  }

  function action(label, code, variant = 'secondary') {
    return <Button type="button" variant={variant} disabled={mutation.busy} onClick={() => change(code)}>{label}</Button>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" aria-label="Booking actions">
        {provider && status === 'REQUESTED' && booking.priceModel === 'FIXED' && action('Accept booking', 'ACCEPT', 'primary')}
        {provider && open && (
          <>
            <Button type="button" variant="secondary" disabled={mutation.busy} aria-expanded={proposing}
              onClick={() => setProposing(!proposing)}>Propose time or price</Button>
            {action('Decline request', 'DECLINE')}
          </>
        )}
        {customer && status === 'PROPOSED' && action('Accept proposal', 'ACCEPT_PROPOSAL', 'primary')}
        {customer && status === 'PROPOSED' && action('Decline proposal', 'DECLINE_PROPOSAL')}
        {provider && status === 'ACCEPTED' && new Date(booking.scheduledAt) <= new Date() && action('Start work', 'START', 'primary')}
        {provider && status === 'IN_PROGRESS' && action('Mark work completed', 'COMPLETE', 'primary')}
        {canCancel && !cancelling && <Button type="button" variant="secondary" disabled={mutation.busy}
          onClick={() => setCancelling(true)}>Cancel booking</Button>}
      </div>
      {provider && status === 'ACCEPTED' && new Date(booking.scheduledAt) > new Date() && (
        <p className="text-sm">Work can start at the agreed time. Refresh this booking when you’re ready.</p>
      )}
      {proposing && (
        <form className="space-y-3" onSubmit={propose}>
          <Field label="Proposed date and time (South Africa)" type="datetime-local" name="proposedAt"
            defaultValue={sastInput(booking.proposedAt || booking.scheduledAt)} required />
          <Field label="Total service price (ZAR)" type="number" name="proposedPrice" min="0" max="9999999999.99" step="0.01"
            defaultValue={booking.proposedPrice ?? booking.agreedPrice ?? ''} required />
          <Button type="submit" disabled={mutation.busy}>Send proposal</Button>
        </form>
      )}
      {cancelling && (
        <div className="space-y-2">
          <p>Cancel this booking? The other participant will be notified.</p>
          <div className="flex flex-wrap gap-2">
            {action('Confirm cancellation', 'CANCEL', 'primary')}
            <Button type="button" variant="secondary" disabled={mutation.busy} onClick={() => setCancelling(false)}>Keep booking</Button>
          </div>
        </div>
      )}
      {mutation.busy && <p role="status">Saving booking…</p>}
      {mutation.error && (
        <div>
          <p role="alert">{mutation.error.message}</p>
          <Button type="button" variant="secondary" onClick={reload}>Reload booking</Button>
        </div>
      )}
    </div>
  );
}

export default function BookingDetail() {
  const { id } = useParams();
  const load = useCallback(() => commerceService.booking(id), [id]);
  const resource = useCommerceResource(load);
  const booking = resource.data;

  return (
    <CommercePage title="Booking details">
      <Link to={booking?.viewer === 'PROVIDER' ? '/bookings/incoming' : '/bookings'} className="btn-secondary inline-flex min-h-11 items-center">
        {booking?.viewer === 'PROVIDER' ? 'Incoming bookings' : 'My bookings'}
      </Link>
      <ResourceFeedback resource={resource} />
      {booking && (
        <>
          <Card className="p-5 space-y-4 break-words">
            <h2 className="text-xl font-semibold">{booking.serviceName}</h2>
            <BookingStatus status={booking.status} />
            <dl className="grid gap-3 sm:grid-cols-2">
              <div><dt className="font-semibold">Provider</dt><dd>{booking.providerName}</dd></div>
              <div><dt className="font-semibold">Customer</dt><dd>{booking.customerName}</dd></div>
              <div><dt className="font-semibold">Date and time</dt><dd>{bookingTime(booking.scheduledAt)} · {booking.durationMinutes} min</dd></div>
              <div><dt className="font-semibold">Service price</dt><dd>{booking.agreedPrice == null ? 'To be agreed' : rand(booking.agreedPrice)}</dd></div>
              <div><dt className="font-semibold">Service area</dt><dd>{booking.serviceArea}</dd></div>
              <div><dt className="font-semibold">Work requested</dt><dd className="whitespace-pre-wrap">{booking.workDescription}</dd></div>
            </dl>
            {booking.proposedAt && (
              <div className="rounded-lg bg-kasi-green-light p-3">
                <h3 className="font-semibold">Provider’s proposal</h3>
                <p>{bookingTime(booking.proposedAt)} · {rand(booking.proposedPrice)}</p>
              </div>
            )}
            {booking.viewer !== 'ADMIN' && <BookingActions booking={booking} reload={resource.retry} />}
          </Card>
          {booking.viewer !== 'ADMIN' && <PaymentPanel kind="BOOKING" id={id} label={booking.serviceName} />}
        </>
      )}
    </CommercePage>
  );
}

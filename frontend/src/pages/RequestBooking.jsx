import { useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card } from '../components';
import { CommercePage, Field, PaymentNote, ResourceFeedback, useCommerceMutation } from '../components/commerce/CommerceUI';
import { OfferingDetails } from '../components/commerce/ProviderServices';
import { requestKey, sastInstant } from '../components/commerce/commerce';
import useCommerceResource from '../components/commerce/useCommerceResource';
import { commerceService } from '../services/api';

export default function RequestBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const load = useCallback(() => commerceService.offering(id), [id]);
  const resource = useCommerceResource(load);
  const mutation = useCommerceMutation();
  const attempt = useRef(null);

  function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const input = {
      serviceId: id,
      workDescription: fields.get('workDescription'),
      serviceArea: fields.get('serviceArea'),
      preferredAt: sastInstant(fields.get('preferredAt')),
    };
    const signature = JSON.stringify(input);
    if (attempt.current?.signature !== signature) attempt.current = { signature, key: requestKey() };
    mutation.run(async () => {
      const booking = await commerceService.request({ ...input, requestKey: attempt.current.key });
      navigate(`/bookings/${booking.id}`, { replace: true });
    });
  }

  return (
    <CommercePage title="Request a booking">
      <ResourceFeedback resource={resource} />
      {resource.data && (
        <>
          <Card className="p-5 space-y-2">
            <h2 className="text-lg font-semibold">{resource.data.name}</h2>
            <OfferingDetails offering={resource.data} />
          </Card>
          <Card className="p-5">
            <form onSubmit={submit} className="space-y-4">
              <p>The provider will respond to your request before the booking is confirmed.</p>
              <Field label="What work do you need?" name="workDescription" multiline required maxLength={2000} />
              <Field label="Service area or location" name="serviceArea" required maxLength={255} />
              <Field label="Preferred date and time (South Africa)" name="preferredAt" type="datetime-local" required />
              {mutation.error && <p role="alert">{mutation.error.message}</p>}
              <Button type="submit" disabled={mutation.busy}>{mutation.busy ? 'Sending…' : 'Send booking request'}</Button>
            </form>
          </Card>
          <PaymentNote />
        </>
      )}
    </CommercePage>
  );
}

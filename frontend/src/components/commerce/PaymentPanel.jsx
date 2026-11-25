import { useCallback, useState } from 'react';
import { Button, Card } from '..';
import { paymentService } from '../../services/api';
import { ResourceFeedback, useCommerceMutation } from './CommerceUI';
import { bookingTime } from './commerce';
import { formatMinor } from './shop';
import { hostedCheckout, paymentLabels } from './paymentStatus';
import useCommerceResource from './useCommerceResource';

export function PaymentActions({ attempt, onResult }) {
  const mutation = useCommerceMutation();
  const checkout = hostedCheckout(attempt.checkoutUrl);
  function change(outcome) {
    mutation.run(async () => {
      if (outcome) await paymentService.simulate(attempt.reference, outcome);
      const result = await paymentService.verify(attempt.reference);
      onResult(result);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {checkout && <a className="btn-primary" href={checkout}>Continue to Paystack</a>}
        {attempt.canVerify && <Button type="button" variant="secondary" disabled={mutation.busy} onClick={() => change()}>
          {mutation.busy ? 'Checking…' : 'Check payment status'}
        </Button>}
      </div>
      {attempt.mockCheckout && (
        <div className="rounded-lg bg-kasi-green-light p-3 space-y-2">
          <p className="font-semibold">Simulated checkout</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={mutation.busy} onClick={() => change('SUCCESS')}>Simulate success</Button>
            <Button type="button" variant="secondary" disabled={mutation.busy} onClick={() => change('FAILED')}>Simulate failure</Button>
            <Button type="button" variant="secondary" disabled={mutation.busy} onClick={() => change('ABANDONED')}>Leave test checkout</Button>
          </div>
        </div>
      )}
      {mutation.error && <p role="alert">{mutation.error.message}</p>}
    </div>
  );
}

export default function PaymentPanel({ kind, id, label }) {
  const load = useCallback(() => paymentService.history(kind, id), [kind, id]);
  const resource = useCommerceResource(load);
  const mutation = useCommerceMutation();
  const [confirm, setConfirm] = useState(false);
  const history = resource.data;
  const current = history?.attempts.find((attempt) =>
    attempt.status === 'PROCESSING' || attempt.status === 'PENDING');
  const action = history?.attempts.length ? 'Retry online payment' : 'Pay online';

  function initialize() {
    mutation.run(async () => {
      setConfirm(false);
      try {
        await paymentService.initialize(kind, id);
      } finally {
        resource.retry();
      }
    });
  }

  return (
    <Card className="space-y-4 p-5 break-words">
      <h2 className="text-lg font-semibold">Payment</h2>
      <ResourceFeedback resource={resource} />
      {history?.enabled === false && <p>Online checkout is currently unavailable.</p>}
      {history?.enabled && <p>Online checkout is in test mode.</p>}
      <p><strong>Payment outside KasiCircle</strong> can be arranged directly. Test payments move no funds.</p>
      {history?.canInitialize && !confirm && !current && (
        <Button type="button" disabled={mutation.busy} onClick={() => setConfirm(true)}>{action}</Button>
      )}
      {confirm && history && (
        <div className="space-y-3 rounded-lg bg-kasi-green-light p-4">
          <p className="font-semibold">Review test payment</p>
          <p>{label} · {formatMinor(history.amountMinor)}</p>
          <p>The payment method is selected at hosted checkout.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={mutation.busy} onClick={initialize}>Start test checkout</Button>
            <Button type="button" variant="secondary" onClick={() => setConfirm(false)}>Back</Button>
          </div>
        </div>
      )}
      {mutation.busy && <p role="status">Opening test checkout…</p>}
      {mutation.error && <p role="alert">{mutation.error.message}</p>}
      {current?.status === 'PENDING' && <p>Checkout is awaiting provider confirmation. Check its status before trying again.</p>}
      {current && (
        <PaymentActions key={current.reference} attempt={current} onResult={resource.retry} />
      )}
      {history?.attempts.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Payment history</h3>
          <ul className="space-y-2">
            {history.attempts.map((attempt) => (
              <li key={attempt.reference} className="text-sm">
                <strong>{paymentLabels[attempt.status]}</strong> · {formatMinor(attempt.amountMinor)} · {bookingTime(attempt.updatedAt)}
                {attempt.status === 'REFUND_REQUIRED' && <p>A refund review is needed. No refund has been confirmed.</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

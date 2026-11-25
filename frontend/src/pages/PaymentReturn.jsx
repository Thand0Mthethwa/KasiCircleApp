import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '../components';
import { CommercePage, ResourceFeedback } from '../components/commerce/CommerceUI';
import { PaymentActions } from '../components/commerce/PaymentPanel';
import { paymentLabels, validPaymentReference } from '../components/commerce/paymentStatus';
import { formatMinor } from '../components/commerce/shop';
import useCommerceResource from '../components/commerce/useCommerceResource';
import { useAuth } from '../contexts/AuthContext';
import { paymentService } from '../services/api';

function VerifyReturn({ reference }) {
  const load = useCallback(async () => {
    const attempt = await paymentService.status(reference);
    if (!attempt.canVerify) return { attempt };
    try {
      return { attempt: await paymentService.verify(reference) };
    } catch (error) {
      return { attempt, verificationError: error.message };
    }
  }, [reference]);
  const resource = useCommerceResource(load);
  const attempt = resource.data?.attempt;
  return (
    <Card className="space-y-3 p-5">
      <ResourceFeedback resource={resource} />
      {attempt && (
        <>
          <p role="status" className="font-semibold">{paymentLabels[attempt.status]}</p>
          <p>{formatMinor(attempt.amountMinor)} · Test payment</p>
          {resource.data.verificationError && <p role="alert">{resource.data.verificationError}</p>}
          {attempt.status === 'REFUND_REQUIRED' && <p>A refund review is needed. No refund has been confirmed.</p>}
          <PaymentActions attempt={attempt} onResult={resource.retry} />
          <Link className="btn-secondary" to={`/${attempt.target.kind === 'ORDER' ? 'orders' : 'bookings'}/${attempt.target.id}`}>
            View {attempt.target.kind.toLowerCase()}
          </Link>
        </>
      )}
    </Card>
  );
}

export default function PaymentReturn() {
  const [params] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const reference = params.get('reference') || params.get('trxref');
  return (
    <CommercePage title="Test payment result">
      {!validPaymentReference(reference) ? <p role="alert">Open the payment from your order or booking.</p>
        : isLoading ? <p role="status">Loading…</p>
          : isAuthenticated ? <VerifyReturn reference={reference} />
            : <Link className="btn-primary" to="/login" state={{ paymentReference: reference }}>Sign in to check payment</Link>}
    </CommercePage>
  );
}

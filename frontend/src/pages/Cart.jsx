import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card } from '../components';
import { maxQuantity, useCart } from '../components/commerce/CartContext';
import { CommercePage, Field, fieldStyle, useCommerceMutation } from '../components/commerce/CommerceUI';
import { requestKey } from '../components/commerce/commerce';
import { formatMinor, subtotal } from '../components/commerce/shop';
import { useAuth } from '../contexts/AuthContext';
import { shopService } from '../services/api';

function CartItems({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.productId} className="flex flex-wrap justify-between gap-2 border-b border-neutral-200 pb-2 break-words">
          <span>{item.name} × {item.quantity} · {formatMinor(item.priceMinor)} each</span>
          <strong>{formatMinor(item.priceMinor * item.quantity)}</strong>
        </li>
      ))}
    </ul>
  );
}

function ActiveCart({ cart, update, clear }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [attempt, setAttempt] = useState(null);
  const [uncertain, setUncertain] = useState(false);
  const reviewMutation = useCommerceMutation();
  const orderMutation = useCommerceMutation();
  const busy = reviewMutation.busy || orderMutation.busy;

  function edit(items) {
    setReview(null);
    setConfirmed(false);
    setAttempt(null);
    update(items);
  }

  const payload = () => ({
    businessId: cart.businessId,
    items: cart.items.map(({ productId, quantity, priceMinor }) => ({ productId, quantity, priceMinor })),
  });

  function reviewCart() {
    setConfirmed(false);
    reviewMutation.run(async () => setReview(await shopService.review(payload())));
  }

  function applyPrices() {
    const items = cart.items.map((item) => {
      const current = review.items.find((line) => line.productId === item.productId);
      return current?.available ? { ...item, name: current.name, priceMinor: current.priceMinor } : item;
    });
    edit(items);
  }

  function submit(event) {
    event.preventDefault();
    if ((!confirmed || !review?.ready) && !uncertain) return;
    const input = attempt || { ...payload(), notes, requestKey: requestKey() };
    setAttempt(input);
    orderMutation.run(async () => {
      try {
        const response = await shopService.place(input);
        clear();
        navigate(`/orders/${response.order.id}`, { replace: true });
      } catch (error) {
        if (error.status && error.status < 500) {
          setUncertain(false);
          setAttempt(null);
          setReview(null);
          setConfirmed(false);
          if (error.status === 409) {
            try {
              setReview(await shopService.review(payload()));
            } catch {
              // The customer can retry review when the connection returns.
            }
          }
        } else {
          setUncertain(true);
        }
        throw error;
      }
    });
  }

  return (
    <>
      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">{cart.businessName}</h2>
        <ul className="space-y-4">
          {cart.items.map((item) => (
            <li key={item.productId} className="space-y-2 border-b border-neutral-200 pb-3 break-words">
              <h3 className="font-semibold">{item.name}</h3>
              <p>{formatMinor(item.priceMinor)} each · {formatMinor(item.priceMinor * item.quantity)}</p>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-2">
                  <span>Quantity</span>
                  <select className={`${fieldStyle} !w-auto`} aria-label={`Quantity for ${item.name}`} value={item.quantity}
                    disabled={busy || uncertain} onChange={(event) => edit(cart.items.map((line) =>
                      line === item ? { ...line, quantity: Number(event.target.value) } : line))}>
                    {Array.from({ length: maxQuantity }, (_, index) => <option key={index + 1}>{index + 1}</option>)}
                  </select>
                </label>
                <Button type="button" variant="secondary" disabled={busy || uncertain}
                  onClick={() => edit(cart.items.filter((line) => line !== item))}>Remove {item.name}</Button>
              </div>
            </li>
          ))}
        </ul>
        <p className="font-semibold">Estimated subtotal {formatMinor(subtotal(cart.items))}</p>
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary" to={`/businesses/${cart.businessId}`}>Continue shopping</Link>
          {!clearing && <Button type="button" variant="secondary" disabled={busy || uncertain} onClick={() => setClearing(true)}>Clear cart</Button>}
          {clearing && <Button type="button" variant="secondary" disabled={busy || uncertain} onClick={clear}>Confirm clear cart</Button>}
          {clearing && <Button type="button" variant="secondary" onClick={() => setClearing(false)}>Keep cart</Button>}
        </div>
      </Card>
      {!isAuthenticated && <Link className="btn-primary" to="/login" state={{ returnToCart: true }}>Sign in to review order</Link>}
      {isAuthenticated && !uncertain && (!review || !review.ready) && (
        <Button type="button" disabled={busy} onClick={reviewCart}>{busy ? 'Checking…' : 'Review collection order'}</Button>
      )}
      {reviewMutation.error && <p role="alert">{reviewMutation.error.message}</p>}
      {review && !review.ready && (
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold">Review changes to your cart</h2>
          {review.items.map((item) => {
            const original = cart.items.find((line) => line.productId === item.productId);
            if (!item.available) return <p key={item.productId}>{original.name} is unavailable in the selected quantity. Adjust or remove it.</p>;
            if (item.priceMinor !== original.priceMinor) return <p key={item.productId}>{item.name} now costs {formatMinor(item.priceMinor)} each.</p>;
            return null;
          })}
          {review.items.some((item) => item.available && item.priceMinor !== cart.items.find((line) => line.productId === item.productId).priceMinor) && (
            <Button type="button" disabled={busy} onClick={applyPrices}>Update prices in cart</Button>
          )}
        </Card>
      )}
      {review?.ready && (
        <Card className="p-5">
          <form className="space-y-4" onSubmit={submit}>
            <h2 className="text-lg font-semibold">Confirm collection order</h2>
            <p className="font-medium">{review.businessName}</p>
            <CartItems items={review.items} />
            <p>Subtotal {formatMinor(review.totalMinor)} · Collection fee {formatMinor(0)}</p>
            <p className="text-lg font-semibold">Total {formatMinor(review.totalMinor)}</p>
            <p><strong>Collection address</strong><br />{review.collectionAddress}</p>
            <p>Wait for the business to mark your order ready before collecting. Arrange payment directly with the business.</p>
            <Field label="Notes for the business (optional)" multiline maxLength={1000} value={notes} disabled={busy || uncertain}
              onChange={(event) => setNotes(event.target.value)} />
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" className="size-5" required checked={confirmed} disabled={busy || uncertain}
                onChange={(event) => setConfirmed(event.target.checked)} />
              I have reviewed my items, total and collection address.
            </label>
            <Button type="submit" disabled={busy || !confirmed}>{busy ? 'Sending…' : uncertain ? 'Retry same order' : 'Place order'}</Button>
          </form>
        </Card>
      )}
      {orderMutation.error && (!review?.ready || uncertain) && <p role="alert">{orderMutation.error.message}</p>}
      {uncertain && <p>The last submission could not be confirmed. Retry the same order or check <Link className="underline" to="/orders">My orders</Link>.</p>}
    </>
  );
}

export default function Cart() {
  const { cart, update, clear } = useCart();
  return (
    <CommercePage title="Your cart">
      {cart ? <ActiveCart key={cart.businessId} cart={cart} update={update} clear={clear} /> : (
        <Card className="space-y-3 p-5">
          <p>Your cart is empty.</p>
          <Link className="btn-primary" to="/explore">Find a business</Link>
        </Card>
      )}
    </CommercePage>
  );
}

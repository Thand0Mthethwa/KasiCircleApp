import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card } from '../components';
import { CommercePage, Pagination, ResourceFeedback, useCommerceMutation } from '../components/commerce/CommerceUI';
import PaymentPanel from '../components/commerce/PaymentPanel';
import { bookingTime } from '../components/commerce/commerce';
import { formatMinor, orderActions, orderLabels } from '../components/commerce/shop';
import useCommerceResource from '../components/commerce/useCommerceResource';
import { useAuth } from '../contexts/AuthContext';
import { shopService } from '../services/api';

function OrderBadge({ status }) {
  return <span className="inline-block rounded-full bg-kasi-green-light px-3 py-1 text-sm font-semibold text-kasi-green">{orderLabels[status]}</span>;
}

export function OrderList({ incoming = false }) {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const load = useCallback(() => shopService.orders(incoming, page), [incoming, page]);
  const resource = useCommerceResource(load);
  return (
    <CommercePage title={incoming ? 'Incoming orders' : 'My orders'}>
      <nav aria-label="Order navigation" className="flex flex-wrap gap-2">
        {incoming ? <Link className="btn-secondary" to="/orders">My orders</Link>
          : <Link className="btn-secondary" to="/cart">Cart</Link>}
        {user?.accountType === 'BUSINESS' && (
          <Link className="btn-secondary" to={incoming ? '/products/manage' : '/orders/incoming'}>{incoming ? 'Manage products' : 'Incoming orders'}</Link>
        )}
      </nav>
      <ResourceFeedback resource={resource} />
      {resource.data && (
        <>
          {resource.data.content.length === 0 && <p>{incoming ? 'You have no incoming orders yet.' : 'You have no orders yet.'}</p>}
          {resource.data.content.map((order) => (
            <Card key={order.id} className="space-y-2 p-5 break-words">
              <h2 className="font-semibold">{incoming ? order.customerName : order.businessName}</h2>
              <p>{bookingTime(order.createdAt)} · {formatMinor(order.totalMinor)}</p>
              <OrderBadge status={order.status} />
              <div><Link className="btn-secondary" to={`/orders/${order.id}`}>View order</Link></div>
            </Card>
          ))}
        </>
      )}
      <Pagination page={page} totalPages={page + (resource.data?.hasNext ? 2 : 1)} setPage={setPage} />
    </CommercePage>
  );
}

function OrderStatusControls({ details, reload }) {
  const [selected, setSelected] = useState(null);
  const mutation = useCommerceMutation();
  const { id, status } = details.order;
  function change() {
    mutation.run(async () => {
      await shopService.change(id, { expectedStatus: status, status: selected });
      reload();
    });
  }
  return (
    <div className="space-y-3">
      {selected ? (
        <>
          <p>{orderActions[selected]}?</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={mutation.busy} onClick={change}>{mutation.busy ? 'Saving…' : 'Confirm change'}</Button>
            <Button type="button" variant="secondary" disabled={mutation.busy} onClick={() => setSelected(null)}>Keep current status</Button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          {details.actions.map((action) => <Button type="button" key={action} variant="secondary" onClick={() => setSelected(action)}>{orderActions[action]}</Button>)}
        </div>
      )}
      {mutation.error && (
        <>
          <p role="alert">{mutation.error.message}</p>
          <Button type="button" variant="secondary" onClick={reload}>Reload order</Button>
        </>
      )}
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const load = useCallback(() => shopService.order(id), [id]);
  const resource = useCommerceResource(load);
  const details = resource.data;
  return (
    <CommercePage title="Order details">
      <nav className="flex flex-wrap gap-2" aria-label="Order navigation">
        <Link className="btn-secondary" to="/orders">My orders</Link>
        {user?.accountType === 'BUSINESS' && <Link className="btn-secondary" to="/orders/incoming">Incoming orders</Link>}
      </nav>
      <ResourceFeedback resource={resource} />
      {details && (
        <>
          <Card className="space-y-4 p-5 break-words">
            <h2 className="text-xl font-semibold">{details.order.businessName}</h2>
            <OrderBadge status={details.order.status} />
            <p className="text-sm">Order reference <strong>{details.order.orderReference}</strong></p>
            <p>Customer {details.order.customerName}</p>
            <ul className="space-y-2">
              {details.items.map((item) => (
                <li key={item.productId} className="flex flex-wrap justify-between gap-2 border-b border-neutral-200 pb-2">
                  <span>{item.productName} × {item.quantity} · {formatMinor(item.priceMinor)} each</span>
                  <strong>{formatMinor(item.priceMinor * item.quantity)}</strong>
                </li>
              ))}
            </ul>
            <p className="text-lg font-semibold">Total {formatMinor(details.order.totalMinor)}</p>
            <p><strong>Collection address</strong><br />{details.collectionAddress}</p>
            {details.notes && <p className="whitespace-pre-wrap"><strong>Customer notes</strong><br />{details.notes}</p>}
            {details.actions.length > 0 && <OrderStatusControls details={details} reload={resource.retry} />}
          </Card>
          <PaymentPanel kind="ORDER" id={id} label={details.order.orderReference} />
          <Card className="space-y-3 p-5">
            <h2 className="font-semibold">Order history</h2>
            <ol className="space-y-2">
              {details.history.map((event) => (
                <li key={event.status}>{orderLabels[event.status]} · {bookingTime(event.changedAt)}</li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </CommercePage>
  );
}

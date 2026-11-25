import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components';
import { BookingStatus, CommercePage, Pagination, ResourceFeedback } from '../components/commerce/CommerceUI';
import { bookingTime, isProvider } from '../components/commerce/commerce';
import useCommerceResource from '../components/commerce/useCommerceResource';
import { useAuth } from '../contexts/AuthContext';
import { commerceService } from '../services/api';

export default function Bookings({ incoming = false }) {
  const [page, setPage] = useState(0);
  const { user } = useAuth();
  const load = useCallback(() => commerceService.bookings(incoming, page), [incoming, page]);
  const resource = useCommerceResource(load);
  return (
    <CommercePage title={incoming ? 'Incoming bookings' : 'My bookings'}>
      <nav aria-label="Booking navigation" className="flex flex-wrap gap-2">
        {incoming && <Link to="/bookings" className="btn-secondary inline-flex min-h-11 items-center">My bookings</Link>}
        {!incoming && isProvider(user) && <Link to="/bookings/incoming" className="btn-secondary inline-flex min-h-11 items-center">Incoming bookings</Link>}
        {isProvider(user) && <Link to="/services/manage" className="btn-secondary inline-flex min-h-11 items-center">Manage services</Link>}
        {!incoming && <Link to="/explore" className="btn-secondary inline-flex min-h-11 items-center">Find a provider</Link>}
      </nav>
      <ResourceFeedback resource={resource} />
      {resource.data && (
        <>
          {resource.data.content.length === 0 && <p>{incoming ? 'You have no incoming bookings yet.' : 'You haven’t requested a booking yet.'}</p>}
          {resource.data.content.map((booking) => (
            <Card key={booking.id} className="p-4 space-y-2 break-words">
              <h2 className="font-semibold">{booking.serviceName}</h2>
              <p className="text-sm">{incoming ? booking.customerName : booking.providerName} · {bookingTime(booking.scheduledAt)}</p>
              <BookingStatus status={booking.status} />
              <div><Link className="btn-secondary inline-flex min-h-11 items-center" to={`/bookings/${booking.id}`}>View booking</Link></div>
            </Card>
          ))}
          <Pagination page={page} totalPages={resource.data.totalPages} setPage={setPage} />
        </>
      )}
    </CommercePage>
  );
}

import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '..';
import { useAuth } from '../../contexts/AuthContext';
import { commerceService } from '../../services/api';
import { servicePrice } from './commerce';
import { Pagination, ResourceFeedback } from './CommerceUI';
import useCommerceResource from './useCommerceResource';

export function OfferingDetails({ offering }) {
  return (
    <>
      <p className="text-sm text-neutral-600">{offering.category} · {offering.durationMinutes} min</p>
      <p className="whitespace-pre-wrap break-words">{offering.description}</p>
      <p className="font-semibold text-kasi-green">{servicePrice(offering)}</p>
    </>
  );
}

export default function ProviderServices({ type, providerId, owner }) {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(0);
  const load = useCallback(() => commerceService.services(type, providerId, page), [type, providerId, page]);
  const resource = useCommerceResource(load);

  return (
    <Card className="p-5 space-y-3">
      <h2 className="text-lg font-semibold">Bookable services</h2>
      {owner && <Link className="btn-secondary inline-flex min-h-11 items-center" to="/services/manage">Manage services</Link>}
      <ResourceFeedback resource={resource} />
      {resource.data && (
        <>
          {!resource.data.content.length && <p className="text-sm text-neutral-600">No services listed yet.</p>}
          {resource.data.content.map((offering) => (
            <article key={offering.id} className="space-y-2 border-t border-neutral-200 pt-4 break-words">
              <h3 className="font-semibold">{offering.name}</h3>
              <OfferingDetails offering={offering} />
              {!owner && (
                <Link className="btn-primary inline-flex min-h-11 items-center"
                  to={isAuthenticated ? `/services/${offering.id}/book` : '/login'}>
                  {isAuthenticated ? (offering.priceModel === 'QUOTE' ? 'Request a quote' : 'Book service') : 'Sign in to book'}
                </Link>
              )}
            </article>
          ))}
          <Pagination page={page} totalPages={resource.data.totalPages} setPage={setPage} />
        </>
      )}
    </Card>
  );
}

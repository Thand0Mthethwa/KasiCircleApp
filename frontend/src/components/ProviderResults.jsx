import { Building2, UserRound } from 'lucide-react';
import { Button } from './index';
import { EmptyState, ErrorState, LoadingSkeleton } from './ui';
import ProviderCard from './ProviderCard';

export default function ProviderResults({ type, results, page, onPage, onReset, filtered, onOpenBusiness }) {
  const business = type === 'business';
  const name = business ? 'businesses' : 'workers';
  const singular = business ? 'business' : 'independent worker';
  const plural = business ? 'businesses' : 'independent workers';
  const title = business ? 'Businesses' : 'Independent workers';
  return (
    <section className="provider-results" aria-labelledby={`${type}-results-heading`}>
      <div className="section-heading">
        <h2 id={`${type}-results-heading`}>{title}</h2>
        {results.status === 'success' && <p className="provider-count" role="status">
          {results.total === null ? `${results.items.length} ${results.items.length === 1 ? singular : plural} shown on this page` : `${results.total} ${business ? (results.total === 1 ? 'business' : 'businesses') : (results.total === 1 ? 'independent worker' : 'independent workers')} listed`}
        </p>}
      </div>
      {results.status === 'loading' && <div data-testid={business ? 'loading-state' : 'worker-loading-state'}><LoadingSkeleton label={`Searching ${name}...`} /></div>}
      {results.status === 'error' && <ErrorState title={`Failed to load ${name}`} message={results.error} onRetry={results.retry} data-testid={business ? 'error-state' : 'worker-error-state'} />}
      {results.status === 'success' && results.items.length === 0 && <EmptyState
        title={`No ${name} found`} icon={business ? Building2 : UserRound}
        description={results.total > 0 ? 'There are no results on this page. Use Previous or reset to return to the first page.' : `Try another keyword or township${business ? ', or business category.' : ', or worker skill/service category.'}`}
        data-testid={business ? 'empty-state' : 'worker-empty-state'}
        action={filtered && <Button variant="secondary" onClick={onReset}>Clear all filters</Button>}
      />}
      {results.status === 'success' && results.items.length > 0 && <div className="business-grid" data-testid={business ? 'business-cards-list' : 'worker-cards-list'}>
        {results.items.map((provider) => <ProviderCard key={provider.key} provider={provider} onOpenBusiness={onOpenBusiness} />)}
      </div>}
      {results.status === 'success' && (results.totalPages > 1 || page > 0) && <nav className="provider-pagination" aria-label={business ? 'Business pages' : 'Worker pages'}>
        <Button variant="secondary" size="sm" onClick={() => onPage(Math.max(0, page - 1))} disabled={page === 0} aria-label={business ? 'Previous page' : 'Previous worker page'}>Previous</Button>
        <span className="text-sm" aria-live="polite">{(results.totalPages === null || page >= results.totalPages) ? `Page ${page + 1} is outside the current results` : `Page ${page + 1} of ${results.totalPages}`}</span>
        <Button variant="secondary" size="sm" onClick={() => onPage(page + 1)} disabled={results.totalPages === null || page + 1 >= results.totalPages} aria-label={business ? 'Next page' : 'Next worker page'}>Next</Button>
      </nav>}
    </section>
  );
}

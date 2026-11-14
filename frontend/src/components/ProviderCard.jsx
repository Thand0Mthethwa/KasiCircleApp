import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { BusinessCard } from './MarketplaceCards';
import { Avatar } from './ui';

export default function ProviderCard({ provider, onOpenBusiness }) {
  if (provider.type === 'business') {
    return <BusinessCard business={provider} onOpen={onOpenBusiness} providerLabel="Business" />;
  }
  const url = `/workers/${encodeURIComponent(provider.id)}`;
  return (
    <article className="marketplace-card provider-worker-card p-5 flex flex-col" data-testid={`worker-card-${provider.id}`}>
      <div className="flex items-start justify-between gap-3 mb-5">
        <Avatar name={provider.displayName} className="!w-16 !h-16 !text-xl" />
        <span className="provider-type">Independent worker</span>
      </div>
      <h3 className="font-display text-2xl font-bold"><Link to={url}>{provider.displayName}</Link></h3>
      <p className="font-semibold mt-1">{provider.headline}</p>
      {provider.serviceCategories.length > 0 && <p className="text-sm text-neutral-600 mt-2">{provider.serviceCategories.join(', ')}</p>}
      <p className="text-sm text-neutral-600 my-3 line-clamp-3">{provider.bio}</p>
      <ul className="flex flex-wrap gap-2 mb-5" aria-label="Skills">
        {provider.skills.slice(0, 4).map((skill) => <li key={skill} className="skill-badge">{skill}</li>)}
        {provider.skills.length > 4 && <li className="skill-badge">+{provider.skills.length - 4} more</li>}
      </ul>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-3 text-sm">
        <p className="flex items-center gap-1.5"><MapPin size={17} aria-hidden="true" />{[provider.city, provider.province].filter(Boolean).join(', ')}</p>
        <Link className="business-details-link inline-flex items-center gap-1.5 font-semibold" to={url} aria-label={`View worker profile for ${provider.displayName}`}>
          View profile <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

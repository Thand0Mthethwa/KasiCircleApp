import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowUpRight, Briefcase, MapPin, Building2 } from "lucide-react";
import { RatingDisplay, StatusBadge } from "./ui";

export function JobCard({ job, onOpen }) {
  return (
    <article className="marketplace-card job-card p-5 md:p-6 flex flex-col sm:flex-row gap-5">
      <span className="state-icon shrink-0 mb-0">
        <Briefcase size={23} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <button
            type="button"
            className="text-left font-semibold text-xl text-kasi-green hover:underline underline-offset-4"
            onClick={() => onOpen(job.id)}
          >
            {job.title}
          </button>
          <StatusBadge status={job.status || "OPEN"} />
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          {job.employerName} · {job.category}
        </p>
        <p className="mt-3 line-clamp-2 text-sm text-neutral-700 leading-relaxed">
          {job.description}
        </p>
        <div className="flex flex-wrap gap-3 mt-5 text-xs text-neutral-600">
          <span className="inline-flex items-center gap-1">
            <MapPin size={15} aria-hidden="true" />
            {job.city}, {job.province}
          </span>
          <span className="rounded-full bg-neutral-100 px-3 py-1 capitalize">
            {job.employmentType?.replaceAll("_", " ").toLowerCase()}
          </span>
        </div>
      </div>
    </article>
  );
}

export function BusinessCard({ business, onOpen }) {
  const [failedImage, setFailedImage] = useState("");
  const photo = business.coverImageUrl;
  const hasPhoto = photo && failedImage !== photo;
  return (
    <article
      className="marketplace-card business-card overflow-hidden flex flex-col"
      data-testid={`business-card-${business.id}`}
    >
      <div className="business-card-image relative overflow-hidden bg-kasi-green-light">
        {hasPhoto ? (
          <img
            src={photo}
            alt={`${business.name} storefront`}
            loading="lazy"
            onError={() => setFailedImage(photo)}
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <Building2 className="absolute inset-0 m-auto w-16 h-16 text-kasi-green" aria-hidden="true" />
            <span className="absolute bottom-3 right-3 rounded-full bg-kasi-surface px-2.5 py-1 text-[11px] text-neutral-600">
              No photo provided
            </span>
          </>
        )}
      </div>
      <div className="business-card-body flex flex-col flex-1">
        <h3><Link to={`/businesses/${business.id}`}>{business.name}</Link></h3>
        <p className="business-card-category">{business.category}</p>
        <p className="sr-only">{business.description}</p>
        <div className="business-card-meta">
          <p className="flex items-start gap-1.5 text-sm text-neutral-600">
            <MapPin size={17} className="shrink-0" aria-hidden="true" />
            <span>{business.city}, {business.province}</span>
          </p>
          <RatingDisplay rating={business.averageRating} count={business.reviewCount}
            data-testid={`business-rating-${business.id}`} />
          <Link to={`/businesses/${business.id}`}
            className="business-details-link inline-flex items-center gap-1.5 text-sm font-semibold text-kasi-green hover:underline underline-offset-4 py-2"
            onClick={onOpen ? (event) => { event.preventDefault(); onOpen(business.id); } : undefined}
            aria-label={`View details for ${business.name}`}>
            View Details <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

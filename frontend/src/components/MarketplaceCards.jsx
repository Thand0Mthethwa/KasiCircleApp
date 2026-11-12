import { useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { RatingDisplay, ShopArt } from "./ui";

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
            <ShopArt className="w-full h-full object-cover" />
            <span className="absolute bottom-3 right-3 rounded-full bg-kasi-surface px-2.5 py-1 text-[11px] text-neutral-600">
              No photo provided
            </span>
          </>
        )}
        <span className="absolute top-3 left-3 rounded-full border border-neutral-200 bg-kasi-surface px-3 py-1.5 text-xs font-medium">
          {business.category}
        </span>
      </div>
      <div className="p-5 md:p-6 flex flex-col flex-1">
        <h3 className="font-semibold text-lg leading-snug">{business.name}</h3>
        <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2 mt-2 mb-4">
          {business.description}
        </p>
        <RatingDisplay
          rating={business.averageRating}
          count={business.reviewCount}
          data-testid={`business-rating-${business.id}`}
        />
        <div className="mt-auto pt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-start gap-1.5 text-xs text-neutral-600">
            <MapPin size={15} className="shrink-0" aria-hidden="true" />
            <span>
              {business.city}, {business.province}
            </span>
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-kasi-green hover:underline underline-offset-4"
            onClick={() => onOpen(business.id)}
            aria-label={`View details for ${business.name}`}
          >
            View Details
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

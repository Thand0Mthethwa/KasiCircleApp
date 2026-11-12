// Adapted from KasiCircle-Demo/src/showcase/shared.jsx (Apache-2.0).
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  MapPin,
  Star,
  Utensils,
  Scissors,
  Wrench,
  Hammer,
  Laptop,
  ShoppingBag,
  HeartPulse,
  Briefcase,
  Sprout,
  LayoutGrid,
} from "lucide-react";

export const categories = [
  { value: "", label: "All businesses", icon: LayoutGrid },
  { value: "Food & Beverage", label: "Food & drink", icon: Utensils },
  { value: "Salon & Beauty", label: "Hair & beauty", icon: Scissors },
  { value: "Retail", label: "Shops & essentials", icon: ShoppingBag },
  { value: "Automotive", label: "Automotive", icon: Wrench },
  {
    value: "Construction & Hardware",
    label: "Hardware & building",
    icon: Hammer,
  },
  {
    value: "Technology & Electronics",
    label: "Tech & electronics",
    icon: Laptop,
  },
  { value: "Health & Wellness", label: "Health & wellness", icon: HeartPulse },
  {
    value: "Professional Services",
    label: "Professional services",
    icon: Briefcase,
  },
  { value: "Other", label: "Other services", icon: Sprout },
];

export const businessName = (business) => business.name;
export const categoryName = (value) =>
  categories.find((category) => category.value === value)?.label || value;
export const artworkFor = (business) => business.coverImageUrl;

export function BusinessCard({ business }) {
  const [failed, setFailed] = useState(false);
  return (
    <article
      className="business-card"
      data-testid={`business-card-${business.id}`}
    >
      <Link
        to={`/businesses/${business.id}`}
        className="business-art-link"
        aria-label={`View ${businessName(business)}`}
      >
        {artworkFor(business) && !failed ? (
          <img
            className="business-art"
            src={artworkFor(business)}
            onError={() => setFailed(true)}
            alt={`${business.name} storefront`}
            loading="lazy"
          />
        ) : (
          <div className="business-art flex items-center justify-center text-xs">
            No photo provided
          </div>
        )}

        <span className="category-chip">{categoryName(business.category)}</span>
      </Link>
      <div className="business-card-body">
        <div className="business-card-title">
          <h3>
            <Link to={`/businesses/${business.id}`}>
              {businessName(business)}
            </Link>
          </h3>
          <ArrowUpRight size={18} aria-hidden="true" />
        </div>
        <p>{business.description}</p>
        <div className="business-rating">
          <Star size={13} fill="currentColor" aria-hidden="true" />
          <strong>
            {business.reviewCount
              ? Number(business.averageRating || 0).toFixed(1)
              : "New"}
          </strong>
          <span>
            {business.reviewCount
              ? `(${business.reviewCount} ${business.reviewCount === 1 ? "review" : "reviews"})`
              : "No reviews yet"}
          </span>
        </div>
        <div className="business-card-bottom">
          <span>
            <MapPin size={13} />
            {[business.city, business.province].filter(Boolean).join(", ")}
          </span>
          <Link
            to={`/businesses/${business.id}`}
            aria-label={`View details for ${businessName(business)}`}
          >
            View profile <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}

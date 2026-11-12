import { createElement } from "react";
import { AlertCircle, RotateCcw, Search, Star } from "lucide-react";
import { Button } from "./index";

export function SectionHeader({ eyebrow, title, description, action, id }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon = Search,
  action,
  ...props
}) {
  return (
    <div className="empty-state" {...props}>
      <span className="state-icon">
        {createElement(icon, { size: 25, "aria-hidden": true })}
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  ...props
}) {
  return (
    <div className="empty-state border-red-200" role="alert" {...props}>
      <span className="state-icon bg-red-50 text-red-700">
        <AlertCircle size={25} aria-hidden="true" />
      </span>
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && (
        <Button type="button" variant="secondary" onClick={onRetry}>
          <RotateCcw size={16} aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ count = 3, label = "Loading listings" }) {
  return (
    <div role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        aria-hidden="true"
      >
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="marketplace-card overflow-hidden">
            <div className="skeleton h-40 rounded-none" />
            <div className="p-5 space-y-3">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatusBadge({ status, children }) {
  const positive = ["OPEN", "ACCEPTED", "ACTIVE"].includes(status);
  const waiting = status === "PENDING";
  return (
    <span
      className={`status-badge ${positive ? "bg-kasi-green-light border-neutral-200 text-kasi-green" : waiting ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-neutral-100 border-neutral-200 text-neutral-600"}`}
    >
      {children || status?.replaceAll("_", " ")}
    </span>
  );
}

export function Avatar({ name = "", className = "" }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "KC";
  return (
    <span className={`avatar ${className}`} aria-hidden="true">
      {initials}
    </span>
  );
}

export function RatingDisplay({ rating, count, ...props }) {
  const rated = Number(rating) > 0 && Number(count) > 0;
  return (
    <div className="flex items-center gap-1.5 text-sm" {...props}>
      <Star
        size={15}
        aria-hidden="true"
        className={rated ? "fill-amber-400 text-amber-700" : "text-neutral-400"}
      />
      {rated ? (
        <>
          <span
            className="font-semibold"
            aria-label={`Rated ${Number(rating).toFixed(1)} out of 5 stars with ${count} ${Number(count) === 1 ? "review" : "reviews"}`}
          >
            {Number(rating).toFixed(1)}
          </span>
          <span className="text-neutral-600">
            ({count} {Number(count) === 1 ? "review" : "reviews"})
          </span>
        </>
      ) : (
        <span className="text-neutral-600">No reviews yet</span>
      )}
    </div>
  );
}

// Decorative illustration adapted from the owner's KasiPreview; never a business photo.
export function ShopArt({ warm = false, className = "" }) {
  return (
    <svg
      viewBox="0 0 360 220"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="360" height="220" fill={warm ? "#eed8c1" : "#d8e8bf"} />
      <circle cx="286" cy="48" r="35" fill="#f3edc7" />
      <path
        d="M0 170Q90 85 190 160T360 138V220H0Z"
        fill={warm ? "#d6b799" : "#b7c992"}
      />
      <path
        d="M0 200Q100 150 200 195T360 175V220H0Z"
        fill={warm ? "#c5a88a" : "#a6bd87"}
      />
      <rect x="102" y="91" width="156" height="111" rx="4" fill="#fff8e7" />
      <path d="M89 91L117 48H244L272 91Z" fill="#235c42" />
      <path
        d="M89 91H272V110Q250 128 228 110Q205 128 182 110Q159 128 136 110Q112 128 89 110Z"
        fill="#eab565"
      />
      <rect x="126" y="137" width="48" height="38" rx="2" fill="#a6b7a2" />
      <path d="M150 137V175M126 156H174" stroke="#fff8e7" strokeWidth="3" />
      <rect x="202" y="136" width="33" height="66" rx="2" fill="#235c42" />
      <circle cx="228" cy="169" r="2" fill="#eab565" />
      <path d="M83 205H280" stroke="#7e9869" strokeWidth="3" />
      <path
        d="M44 203V159M35 167Q20 142 38 130Q60 129 59 150Q73 164 54 173"
        stroke="#55764d"
        strokeWidth="4"
        fill="#9eb77c"
      />
    </svg>
  );
}

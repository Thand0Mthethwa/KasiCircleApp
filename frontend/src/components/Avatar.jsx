import { useState } from 'react';

export default function Avatar({ name = "", src, alt = "", className = "" }) {
  const [failedSrc, setFailedSrc] = useState(null);
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
    <span className={`avatar overflow-hidden ${className}`} aria-hidden={alt ? undefined : true} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
      {src && failedSrc !== src ? <img src={src} alt="" className="w-full h-full object-cover" onError={() => setFailedSrc(src)} /> : initials}
    </span>
  );
}


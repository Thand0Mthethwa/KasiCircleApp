import { MapPin } from "lucide-react";

export default function AuthLayout({ title, description, eyebrow, children }) {
  return (
    <main className="content-container auth-layout">
      <aside className="auth-story" aria-label="Your local community">
        <p className="eyebrow flex items-center gap-2">
          <MapPin size={14} aria-hidden="true" />A place in the circle
        </p>
        <h2 className="font-display font-normal">
          Good things.
          <br />
          Closer to home.
        </h2>
        <p className="text-neutral-700 leading-relaxed max-w-sm">
          Your corner shop. Your skilled neighbour. Your next opportunity. It
          all starts with a connection.
        </p>
        <img src="/images/storefront.webp" alt="" className="w-full mt-8 rounded-lg" />
        <p className="text-xs text-neutral-600 mt-6">
          Rooted in South African communities.
        </p>
      </aside>
      <section className="auth-form-panel" aria-labelledby="auth-title">
        <p className="eyebrow mb-4">{eyebrow}</p>
        <h1
          id="auth-title"
          className="font-display text-4xl tracking-tight mb-3"
        >
          {title}
        </h1>
        <p className="text-sm text-neutral-600 leading-relaxed mb-7">
          {description}
        </p>
        {children}
      </section>
    </main>
  );
}

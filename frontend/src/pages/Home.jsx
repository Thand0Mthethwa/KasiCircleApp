import { createElement, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Coffee,
  MapPin,
  Scissors,
  Store,
  Wrench,
  Zap,
} from "lucide-react";
import { SearchBar } from "../components";
import { BusinessCard } from "../components/MarketplaceCards";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  SectionHeader,
  ShopArt,
} from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { businessService } from "../services/api";

const workerSkills = [
  { label: "Electrician", icon: Zap },
  { label: "Plumber", icon: Wrench },
  { label: "Mechanic", icon: Briefcase },
  { label: "Hairdresser", icon: Scissors },
];
const businessCategories = [
  { label: "Food & drink", category: "Food & Beverage", icon: Coffee },
  { label: "Everyday essentials", category: "Retail", icon: Store },
  { label: "Beauty & care", category: "Salon & Beauty", icon: Scissors },
  { label: "Local services", category: "Professional Services", icon: Wrench },
];
const searchTypes = {
  businesses: { path: "/explore", placeholder: "Find a local business..." },
  workers: {
    path: "/workers",
    placeholder: "Search workers by name or skill...",
  },
  jobs: { path: "/jobs", placeholder: "Search local jobs..." },
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchType, setSearchType] = useState("businesses");
  const [businesses, setBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError("");
    businessService
      .getAllBusinesses({ page: 0, size: 3 })
      .then((result) => {
        if (active) setBusinesses(result?.content || []);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError.data?.message ||
              requestError.message ||
              "The business directory is unavailable. Please try again.",
          );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const handleSearch = (query) => {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    navigate(searchTypes[searchType].path + (params.size ? `?${params}` : ""));
  };
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <main className="page-wrapper">
      <section className="home-hero content-container">
        <div className="hero-copy">
          <p className="eyebrow flex items-center gap-2">
            <MapPin size={14} aria-hidden="true" />
            Your neighbourhood, connected
          </p>
          <h1>
            Good things.
            <br />
            <span>Closer to home.</span>
          </h1>
          <p className="hero-description">
            The corner shop. The skilled neighbour. Your next opportunity.
            Discover the people and places that make your kasi.
          </p>
          <div className="hero-search">
            <div
              className="flex flex-wrap gap-1 mb-3"
              role="group"
              aria-label="Search marketplace by"
            >
              {Object.keys(searchTypes).map((type) => (
                <button
                  key={type}
                  type="button"
                  className="search-scope"
                  aria-pressed={searchType === type}
                  onClick={() => setSearchType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <SearchBar
              key={searchType}
              placeholder={searchTypes[searchType].placeholder}
              onSearch={handleSearch}
            />
          </div>
          <p className="mt-4 text-xs text-neutral-600">
            Local businesses. Local skills. A world of possibility.
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="hero-art-label">ROOTED IN OUR COMMUNITIES</span>
          <ShopArt className="hero-shop" />
          <div className="hero-art-note">
            <span className="brand-mark">k</span>
            <div>
              <strong>Small business. Big heart.</strong>
              <span>There’s so much to discover, right here.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="marketplace-strip">
        <div className="content-container py-7">
          <h2 className="text-sm font-medium mb-4">
            {greeting}, {user?.firstName || "neighbour"}!
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              {
                label: "Explore businesses",
                detail: "Find your next local favourite",
                path: "/explore",
                icon: Store,
              },
              {
                label: "Browse workers",
                detail: "Good people. Practical skills.",
                path: "/workers",
                icon: Wrench,
              },
              {
                label: "Find local jobs",
                detail: "Take your next step, close to home",
                path: "/jobs",
                icon: Briefcase,
              },
            ].map((item) => (
              <button
                key={item.path}
                type="button"
                className="marketplace-shortcut"
                onClick={() => navigate(item.path)}
                aria-label={item.label}
              >
                <span className="shortcut-icon">
                  {createElement(item.icon, { size: 21, "aria-hidden": true })}
                </span>
                <span className="text-left flex-1">
                  <strong className="block text-sm">{item.label}</strong>
                  <span className="text-xs text-neutral-600 mt-1 block">
                    {item.detail}
                  </span>
                </span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section
        className="content-container py-12 md:py-16"
        aria-labelledby="categories-heading"
      >
        <SectionHeader
          id="categories-heading"
          eyebrow="Something for every day"
          title="What are you looking for?"
          description="From everyday essentials to a little something special."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {businessCategories.map((item) => (
            <button
              type="button"
              key={item.category}
              onClick={() =>
                navigate(
                  `/explore?category=${encodeURIComponent(item.category)}`,
                )
              }
              className="category-tile"
            >
              <span className="state-icon">
                {createElement(item.icon, { size: 24, "aria-hidden": true })}
              </span>
              <span className="font-semibold text-sm">{item.label}</span>
              <span className="text-xs text-neutral-600 mt-1">
                Explore local{" "}
                <ArrowRight
                  className="inline ml-1"
                  size={13}
                  aria-hidden="true"
                />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section
        className="content-container pb-12 md:pb-16"
        aria-labelledby="local-businesses-heading"
      >
        <SectionHeader
          id="local-businesses-heading"
          eyebrow="Made in the neighbourhood"
          title="Meet your local businesses"
          description="Explore businesses listed by their owners on KasiCircle."
          action={
            <Link
              className="link-text text-sm inline-flex items-center gap-2 py-2"
              to="/explore"
            >
              View all businesses
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          }
        />
        {isLoading ? (
          <LoadingSkeleton label="Loading local businesses" />
        ) : error ? (
          <ErrorState
            title="We couldn’t load local businesses"
            message={error}
            onRetry={() => setRetry((value) => value + 1)}
          />
        ) : businesses.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                onOpen={(id) => navigate(`/businesses/${id}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Your neighbourhood starts with you"
            description="No businesses have been listed yet. Give your business a place in the circle."
            icon={Store}
            action={
              <Link
                className="btn-primary mt-2"
                to={
                  user?.accountType === "BUSINESS"
                    ? "/business-profile"
                    : "/register"
                }
              >
                List your business
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            }
          />
        )}
      </section>

      <section
        className="content-container pb-12 md:pb-16"
        aria-labelledby="skills-heading"
      >
        <div className="skills-section">
          <SectionHeader
            id="skills-heading"
            eyebrow="A helping hand, nearby"
            title="Find workers by skill"
            description="Connect with people who know their craft."
            action={
              <Link className="link-text text-sm py-2" to="/workers">
                Meet local workers →
              </Link>
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {workerSkills.map(({ label, icon }) => (
              <button
                key={label}
                type="button"
                onClick={() =>
                  navigate(`/workers?skill=${encodeURIComponent(label)}`)
                }
                className="skill-tile"
              >
                {createElement(icon, { size: 22, "aria-hidden": true })}
                <span>{label}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

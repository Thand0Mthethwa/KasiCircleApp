import { createElement, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Coffee,
  MapPin,
  ArrowDown,
  Search,
  X,
  Leaf,
  Scissors,
  Store,
  Wrench,
  Zap,
} from "lucide-react";
import { SearchBar } from "../components";
import "../styles/home-reference.css";
import { BusinessCard, categories } from "../components/HomeBusinessCard";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  SectionHeader,
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
  const [category, setCategory] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
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
      .getAllBusinesses({ page: 0, size: 3, ...(category ? { category } : {}) })
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
  }, [retry, category]);

  const handleSearch = (query) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    if (city.trim() && searchType === "businesses")
      params.set("city", city.trim());
    navigate(searchTypes[searchType].path + (params.size ? `?${params}` : ""));
  };
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <main className="home-reference">
      <section className="discover-hero">
        <div className="site-container hero-content">
          <div className="hero-message">
            <span className="overline">
              <span className="small-dot" /> GOOD THINGS START CLOSE TO HOME
            </span>
            <h1>
              Your next local
              <br />
              favourite is <em>right here.</em>
            </h1>
            <p>
              Discover the food, shops, and everyday services that make a
              neighbourhood feel like home.
            </p>
            <button
              type="button"
              className="hero-browse"
              onClick={() =>
                document
                  .getElementById("directory")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              Explore the neighbourhood <ArrowDown size={16} />
            </button>
            <div className="hero-local-note">
              <Leaf size={15} />
              <span>Rooted in our communities. Made for our kasi.</span>
            </div>
          </div>
          <div className="hero-illustration" aria-hidden="true">
            <span className="hero-art-label">
              A LITTLE LOCAL GOES A LONG WAY.
            </span>
            <img src="/demo-assets/neighbourhood-hero.svg" alt="" />
            <div className="hero-local-card">
              <span className="local-card-icon">
                <Store size={20} />
              </span>
              <div>
                <strong>Big heart. Local business.</strong>
                <span>There’s a whole community to discover.</span>
              </div>
              <span className="local-card-spark">✳</span>
            </div>
            <span className="hero-coordinate">GAUTENG, SOUTH AFRICA ↗</span>
          </div>
        </div>
        <form
          className="directory-search site-container"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const params = new URLSearchParams();
            if (search.trim()) params.set("search", search.trim());
            if (city.trim()) params.set("city", city.trim());
            navigate(`/explore${params.size ? `?${params}` : ""}`);
          }}
        >
          <div className="search-input-group">
            <Search size={20} />
            <div>
              <label htmlFor="business-search">What are you looking for?</label>
              <input
                type="search"
                id="business-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="A kota spot, a salon, a local service…"
              />
            </div>
            {search && (
              <button
                type="button"
                className="clear-field"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div className="search-input-group location-input">
            <MapPin size={20} />
            <div>
              <label htmlFor="city-search">Around your neighbourhood</label>
              <input
                id="city-search"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Township or city, e.g. Daveyton"
              />
            </div>
            {city && (
              <button
                type="button"
                className="clear-field"
                onClick={() => setCity("")}
                aria-label="Clear location"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button className="primary-button search-submit" type="submit">
            Find businesses <ArrowRight size={16} />
          </button>
        </form>
      </section>

      <section
        className="site-container directory-section"
        id="directory"
        aria-labelledby="local-businesses-heading"
      >
        <SectionHeader
          id="local-businesses-heading"
          eyebrow="A GOOD PLACE TO START"
          title="Find your kind of local."
          description="Explore businesses listed by their owners on KasiCircle."
        />
        <div className="directory-layout">
          <aside
            className={`directory-sidebar ${filterOpen ? "expanded" : ""}`}
            aria-label="Business filters"
          >
            <button
              type="button"
              className="mobile-filter-toggle"
              onClick={() => setFilterOpen(!filterOpen)}
              aria-expanded={filterOpen}
            >
              Browse by category <span>{filterOpen ? "−" : "+"}</span>
            </button>
            <div className="sidebar-content">
              <h3>Browse by category</h3>
              <div className="category-list">
                {categories.map((item) => (
                  <button
                    type="button"
                    key={item.label}
                    className={category === item.value ? "selected" : ""}
                    aria-pressed={category === item.value}
                    onClick={() => {
                      setCategory(item.value);
                      setFilterOpen(false);
                    }}
                  >
                    {createElement(item.icon, {
                      size: 17,
                      strokeWidth: 1.6,
                      "aria-hidden": true,
                    })}
                    <span>{item.label}</span>
                    {category === item.value && (
                      <span className="category-active-dot" />
                    )}
                  </button>
                ))}
              </div>
              <div className="sidebar-note">
                <span className="sprout-mark" aria-hidden="true">
                  ✳
                </span>
                <strong>Built around community.</strong>
                <p>
                  From daily essentials to something a little special — local
                  businesses bring us closer.
                </p>
              </div>
            </div>
          </aside>
          <div className="directory-results">
            <div className="results-toolbar">
              <p>Discover real businesses in your community</p>
              <Link to="/explore" className="outline-button">
                View full directory
              </Link>
            </div>
            {isLoading ? (
              <LoadingSkeleton label="Loading local businesses" />
            ) : error ? (
              <ErrorState
                title="We couldn’t load local businesses"
                message={error}
                onRetry={() => setRetry((value) => value + 1)}
              />
            ) : businesses.length ? (
              <div className="business-grid">
                {businesses.map((business) => (
                  <BusinessCard key={business.id} business={business} />
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
          </div>
        </div>
      </section>

      <section className="marketplace-strip">
        <div className="content-container py-7">
          <h2 className="text-sm font-medium mb-4">
            {greeting}, {user?.firstName || "neighbour"}!
          </h2>
          <div
            className="flex gap-2 my-3"
            role="group"
            aria-label="Search marketplace by"
          >
            {["workers", "jobs"].map((type) => (
              <button
                key={type}
                type="button"
                className="outline-button"
                aria-pressed={searchType === type}
                onClick={() => setSearchType(type)}
              >
                {type === "workers" ? "Workers" : "Jobs"}
              </button>
            ))}
          </div>
          {searchType !== "businesses" && (
            <SearchBar
              key={searchType}
              placeholder={searchTypes[searchType].placeholder}
              onSearch={handleSearch}
            />
          )}
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

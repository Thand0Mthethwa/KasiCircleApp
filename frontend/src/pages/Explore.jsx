import { createElement, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components";
import ProviderResults from "../components/ProviderResults";
import useProviderResults from "../hooks/useProviderResults";
import { Search, MapPin, X, LayoutGrid, Utensils, ShoppingBag, Wrench, Hammer, Scissors, Briefcase, HeartPulse, Laptop, MoreHorizontal } from "lucide-react";
import "../styles/explore-reference.css";
import "../styles/unified-marketplace.css";

const categoryIcons = [LayoutGrid, Utensils, ShoppingBag, Wrench, Hammer, Scissors, Briefcase, HeartPulse, Laptop, MoreHorizontal];
const categoryLabels = ["All", "Food", "Retail", "Automotive", "Hardware", "Beauty", "Services", "Health", "Technology", "Other"];
const CATEGORIES = [
  "All",
  "Food & Beverage",
  "Retail",
  "Automotive",
  "Construction & Hardware",
  "Salon & Beauty",
  "Professional Services",
  "Health & Wellness",
  "Technology & Electronics",
  "Other",
];

const PROVIDERS = ["all", "businesses", "workers"];
const labels = { all: "All", businesses: "Businesses", workers: "Workers" };
function readPage(value) {
  if (!/^[1-9]\d*$/.test(value || "")) return 0;
  const page = Number(value);
  return Number.isInteger(page) && page > 0 && page <= 2147483647 ? page - 1 : 0;
}

export default function Explore() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const pendingQuery = useRef(query);
  useEffect(() => { pendingQuery.current = query; }, [query]);
  const defaultProvider = pathname.replace(/\/+$/, "") === "/businesses" ? "businesses" : "all";
  const provider = PROVIDERS.includes(params.get("provider")) ? params.get("provider") : defaultProvider;
  const search = params.get("search") || "";
  const city = params.get("city") || "";
  const category = params.get("category") || "All";
  const skill = params.get("skill") || "";
  const workerCategory = params.get("workerCategory") || "";
  const businessPage = readPage(params.get("businessPage"));
  const workerPage = readPage(params.get("workerPage"));
  const [draft, setDraft] = useState({ search, city, skill, workerCategory });
  useEffect(() => { setDraft({ search, city, skill, workerCategory }); }, [search, city, skill, workerCategory]);
  const showBusinesses = provider !== "workers";
  const showWorkers = provider !== "businesses";
  const businessResults = useProviderResults("business", { search, city, category: category === "All" ? "" : category, page: businessPage }, showBusinesses);
  const workerResults = useProviderResults("worker", { search, city, category: workerCategory, skill, page: workerPage }, showWorkers);
  const filtered = Boolean(search || city || skill || workerCategory || category !== "All" || businessPage || workerPage);

  function update(values) {
    // Router navigation is asynchronous. Compose rapid filter/submission events
    // against the latest requested URL instead of dropping an in-flight edit.
    const next = new URLSearchParams(pendingQuery.current);
    Object.entries(values).forEach(([key, value]) => {
      if (value === "" || value === null) next.delete(key);
      else next.set(key, String(value));
    });
    pendingQuery.current = next.toString();
    setParams(next);
  }

  function submit(event) {
    event.preventDefault();
    update({ search: draft.search.trim(), city: draft.city.trim(), skill: draft.skill.trim(), workerCategory: draft.workerCategory.trim(), businessPage: null, workerPage: null });
  }
  function reset() {
    setDraft({ search: "", city: "", skill: "", workerCategory: "" });
    update({ search: null, city: null, skill: null, workerCategory: null, category: null, businessPage: null, workerPage: null });
  }
  function selectProvider(value) {
    update({ provider: value === defaultProvider ? null : value });
  }
  function tabKey(event, index) {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % PROVIDERS.length;
    if (event.key === "ArrowLeft") next = (index + PROVIDERS.length - 1) % PROVIDERS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = PROVIDERS.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectProvider(PROVIDERS[next]);
    document.getElementById(`provider-tab-${PROVIDERS[next]}`)?.focus();
  }
  const field = (name) => ({ value: draft[name], onChange: (event) => setDraft((current) => ({ ...current, [name]: event.target.value })) });

  return (
    <div className="page-wrapper explore-reference unified-marketplace">
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-image"><img src="/images/storefront.webp" alt="" width="1440" height="900" fetchpriority="high" /></div>
        <div className="shell hero-inner">
          <h1 id="hero-heading">Find local providers<br />near you.</h1>
          <p>Discover businesses and independent<br className="desktop-break" /> workers in your community.</p>
        </div>
      </section>
      <main className="shell directory-shell">
        <form id="marketplace-search" onSubmit={submit} className="search-panel" role="search" aria-label="Marketplace search">
          <div className="search-fields">
            <div className="search-field">
              <Search aria-hidden="true" />
              <label className="sr-only" htmlFor="provider-search">Search businesses and workers</label>
              <input id="provider-search" type="search" {...field("search")} placeholder="Business name or worker keyword..." />
              {draft.search && <button type="button" onClick={() => setDraft((current) => ({ ...current, search: "" }))} aria-label="Clear search keyword"><X size={16} /></button>}
            </div>
            <div className="search-field location-field">
              <MapPin aria-hidden="true" />
              <label className="sr-only" htmlFor="provider-city">Filter by township or city</label>
              <input id="provider-city" type="text" {...field("city")} placeholder="Filter by township/city..." />
              {draft.city && <button type="button" onClick={() => setDraft((current) => ({ ...current, city: "" }))} aria-label="Clear city filter"><X size={16} /></button>}
            </div>
          </div>
          <button type="submit" className="primary-button">Search</button>
        </form>
        <p className="search-explainer">Search business names or worker names and profiles. For a specific worker skill, use the filters below.</p>
        <div className="provider-tabs" role="tablist" aria-label="Provider types">
          {PROVIDERS.map((value, index) => <button key={value} type="button" role="tab" id={`provider-tab-${value}`}
            aria-selected={provider === value} aria-controls="marketplace-results" tabIndex={provider === value ? 0 : -1}
            onClick={() => selectProvider(value)} onKeyDown={(event) => tabKey(event, index)}>{labels[value]}</button>)}
        </div>
        {showBusinesses && <section className="business-filter-controls" aria-label="Business filters">
          <h2 className="source-filter-heading">Business categories</h2>
          <nav className="categories live-categories" aria-label="Business Categories">
            {CATEGORIES.map((value, index) => <button key={value} type="button" className={`category-button${category === value ? " selected" : ""}`}
              onClick={() => update({ category: value === "All" ? null : value, businessPage: null })} aria-label={value} aria-pressed={category === value}>
              {createElement(categoryIcons[index], { "aria-hidden": true })}<span>{categoryLabels[index]}</span>
            </button>)}
          </nav>
        </section>}
        {showWorkers && <fieldset className="worker-filter-controls">
          <legend className="source-filter-heading">Worker filters</legend>
          <div className="worker-filter-fields">
            <label>Worker skill<input form="marketplace-search" className="input-field" {...field("skill")} placeholder="e.g. Plumbing" /></label>
            <label>Worker service category<input form="marketplace-search" className="input-field" {...field("workerCategory")} placeholder="e.g. Repairs" /></label>
          </div>
          <p className="text-sm text-neutral-600 mt-2">Applies to independent workers only. Select Search to apply.</p>
        </fieldset>}
        <div className="discovery-toolbar">
          <p>Each provider directory has its own results and pages.</p>
          {filtered && <button type="button" className="clear-filters" onClick={reset} aria-label="Reset all filters"><X size={16} /> Clear filters</button>}
          <Button variant="secondary" onClick={() => navigate("/business-profile")}>List your business</Button>
        </div>
        <div role="tabpanel" id="marketplace-results" aria-labelledby={`provider-tab-${provider}`} tabIndex={0} className="provider-panels">
          {showBusinesses && <ProviderResults type="business" results={businessResults} page={businessPage}
            onPage={(page) => update({ businessPage: page ? page + 1 : null })} onReset={reset} filtered={filtered}
            onOpenBusiness={(id) => navigate(`/businesses/${id}`)} />}
          {showWorkers && <ProviderResults type="worker" results={workerResults} page={workerPage}
            onPage={(page) => update({ workerPage: page ? page + 1 : null })} onReset={reset} filtered={filtered} />}
        </div>
      </main>
    </div>
  );
}

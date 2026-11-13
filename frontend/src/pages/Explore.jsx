import React, { createElement, useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components";
import { businessService } from "../services/api";
import { BusinessCard } from "../components/MarketplaceCards";
import { EmptyState, ErrorState, LoadingSkeleton } from "../components/ui";
import { Search, MapPin, X, Building2, LayoutGrid, Utensils, ShoppingBag, Wrench, Hammer, Scissors, Briefcase, HeartPulse, Laptop, MoreHorizontal } from "lucide-react";

import "../styles/explore-reference.css";

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

export default function Explore() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query params or defaults
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "All";
  const initialCity = searchParams.get("city") || "";

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [cityInput, setCityInput] = useState(initialCity);
  const [cityFilter, setCityFilter] = useState(initialCity);

  const [businesses, setBusinesses] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const pageSize = 8;

  // Fetch businesses whenever filters or page change
  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const categoryParam = selectedCategory !== "All" ? selectedCategory : "";
      const response = await businessService.getAllBusinesses({
        page,
        size: pageSize,
        search: searchTerm,
        category: categoryParam,
        city: cityFilter,
      });

      if (response && response.content) {
        setBusinesses(response.content);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else {
        setBusinesses([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (err) {
      const message =
        err.data?.message ||
        err.message ||
        "Unable to load businesses. Please check your connection and try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, selectedCategory, cityFilter]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  // Sync state to URL search params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedCategory && selectedCategory !== "All")
      params.set("category", selectedCategory);
    if (cityFilter) params.set("city", cityFilter);
    setSearchParams(params, { replace: true });
  }, [searchTerm, selectedCategory, cityFilter, setSearchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    setSearchTerm(searchInput.trim());
    setCityFilter(cityInput.trim());
  };

  const handleCategorySelect = (category) => {
    setPage(0);
    setSelectedCategory(category);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setSelectedCategory("All");
    setCityInput("");
    setCityFilter("");
    setPage(0);
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    (selectedCategory && selectedCategory !== "All") ||
    cityFilter,
  );

  return (
    <div className="page-wrapper explore-reference">
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-image">
          <img src="/images/storefront.webp" alt="" width="1440" height="900" fetchpriority="high" />
        </div>
        <div className="shell hero-inner">
          <h1 id="hero-heading">Find businesses<br />near you.</h1>
          <p>Discover food, shops and services<br className="desktop-break" /> in your township.</p>
        </div>
      </section>
      <main className="shell directory-shell">
        <form onSubmit={handleSearchSubmit} className="search-panel" role="search">
          <div className="search-fields">
            <div className="search-field">
              <Search aria-hidden="true" />
              <label className="sr-only" htmlFor="business-search">Find a local business</label>
              <input id="business-search" type="search" value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search businesses by name..." aria-label="Search businesses by name" />
              {searchInput && <button type="button" onClick={() => setSearchInput("")} aria-label="Clear search keyword"><X size={16} /></button>}
            </div>
            <div className="search-field location-field">
              <MapPin aria-hidden="true" />
              <label className="sr-only" htmlFor="business-city">Your neighbourhood</label>
              <input id="business-city" type="text" value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Filter by township/city..." aria-label="Filter by township or city" />
              {cityInput && <button type="button" onClick={() => setCityInput("")} aria-label="Clear city filter"><X size={16} /></button>}
            </div>
          </div>
          <button type="submit" className="primary-button">Search</button>
        </form>
        <nav className="categories live-categories" aria-label="Business Categories">
          {CATEGORIES.map((category, index) => (
            <button key={category} type="button" className={`category-button${selectedCategory === category ? " selected" : ""}`}
              onClick={() => handleCategorySelect(category)} aria-label={category} aria-pressed={selectedCategory === category}>
              {createElement(categoryIcons[index], { "aria-hidden": true })}<span>{categoryLabels[index]}</span>
            </button>
          ))}
        </nav>
        <section className="directory" aria-labelledby="directory-heading">
          <div className="section-heading">
            <h2 id="directory-heading">Explore local businesses</h2>
            <Button variant="secondary" onClick={() => navigate("/business-profile")}>List your business</Button>
          </div>
          {hasActiveFilters && <button type="button" className="clear-filters" onClick={handleResetFilters} aria-label="Reset all filters"><X size={16} /> Clear filters</button>}
        {!isLoading && !error && (
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>
              {totalElements} {totalElements === 1 ? "business" : "businesses"}{" "}
              listed
            </span>
            {hasActiveFilters && (
              <span className="text-kasi-green font-medium">Filtered</span>
            )}
          </div>
        )}
        {isLoading && (
          <div data-testid="loading-state">
            <LoadingSkeleton label="Searching directory..." />
          </div>
        )}
        {!isLoading && error && (
          <ErrorState
            title="Failed to load businesses"
            message={error}
            onRetry={fetchBusinesses}
            data-testid="error-state"
          />
        )}
        {!isLoading && !error && businesses.length === 0 && (
          <EmptyState
            title="No businesses found"
            description={
              hasActiveFilters
                ? "No registered businesses match your search or filter criteria."
                : "There are currently no registered businesses on KasiCircle."
            }
            icon={Building2}
            data-testid="empty-state"
            action={
              hasActiveFilters && (
                <Button variant="secondary" onClick={handleResetFilters}>
                  Clear all filters
                </Button>
              )
            }
          />
        )}
        {!isLoading && !error && businesses.length > 0 && (
          <>
            <div
              className="business-grid"
              data-testid="business-cards-list"
            >
              {businesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  onOpen={(id) => navigate(`/businesses/${id}`)}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <nav
                className="pt-6 flex items-center justify-between gap-3 border-t border-neutral-200"
                aria-label="Business pages"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setPage((previous) => Math.max(0, previous - 1))
                  }
                  disabled={page === 0}
                  aria-label="Previous page"
                >
                  Previous
                </Button>
                <span className="text-sm text-neutral-600" aria-live="polite">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setPage((previous) =>
                      Math.min(totalPages - 1, previous + 1),
                    )
                  }
                  disabled={page >= totalPages - 1}
                  aria-label="Next page"
                >
                  Next
                </Button>
              </nav>
            )}
          </>
        )}
        </section>
      </main>
    </div>
  );
}

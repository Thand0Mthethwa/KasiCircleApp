import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, Header } from "../components";
import { businessService } from "../services/api";
import { BusinessCard } from "../components/MarketplaceCards";
import { EmptyState, ErrorState, LoadingSkeleton } from "../components/ui";
import { Search, MapPin, X, Building2 } from "lucide-react";

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
    <div className="page-wrapper pb-12">
      <Header
        title="Business Directory"
        subtitle="Discover the businesses that make your kasi. Good things are closer than you think."
        onBack={() => navigate("/home")}
      />
      <main className="content-container py-8 md:py-10 space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-display">Explore Kasi Businesses</h2>
            <p className="text-sm text-neutral-600 mt-2">
              Browse registered local services, artisans, and enterprises in
              your community.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate("/business-profile")}
          >
            List your business
          </Button>
        </div>
        <Card className="p-5 md:p-6">
          <form
            onSubmit={handleSearchSubmit}
            className="grid md:grid-cols-[1.3fr_1fr_auto] gap-4 items-end"
            role="search"
          >
            <div>
              <label
                htmlFor="business-search"
                className="block text-sm font-semibold mb-2"
              >
                Find a local business
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-4 w-4 h-4 text-neutral-500 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="business-search"
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search businesses by name..."
                  aria-label="Search businesses by name"
                  className="input-field pl-10 pr-12"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    className="absolute right-1 top-0.5 icon-button"
                    aria-label="Clear search keyword"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="business-city"
                className="block text-sm font-semibold mb-2"
              >
                Your neighbourhood
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3.5 top-4 w-4 h-4 text-neutral-500 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="business-city"
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Filter by township/city (e.g. Soweto)..."
                  aria-label="Filter by township or city"
                  className="input-field pl-10 pr-12"
                />
                {cityInput && (
                  <button
                    type="button"
                    onClick={() => setCityInput("")}
                    className="absolute right-1 top-0.5 icon-button"
                    aria-label="Clear city filter"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                <Search size={17} aria-hidden="true" />
                Search
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResetFilters}
                  aria-label="Reset all filters"
                >
                  Reset
                </Button>
              )}
            </div>
          </form>
        </Card>
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow">Filter by Category</span>
            {selectedCategory !== "All" && (
              <button
                type="button"
                onClick={() => handleCategorySelect("All")}
                className="link-text text-sm"
              >
                Show All
              </button>
            )}
          </div>
          <div
            className="flex gap-2 overflow-x-auto pb-3 max-w-full"
            role="group"
            aria-label="Business Categories"
          >
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className="filter-chip whitespace-nowrap shrink-0"
                onClick={() => handleCategorySelect(category)}
                aria-pressed={selectedCategory === category}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
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
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
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
      </main>
    </div>
  );
}

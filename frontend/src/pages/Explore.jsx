import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, Header, LoadingSpinner } from '../components';
import { businessService } from '../services/api';
import {
  Search,
  Building2,
  MapPin,
  Tag,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  RotateCcw,
  Star,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Food & Beverage',
  'Retail',
  'Automotive',
  'Construction & Hardware',
  'Salon & Beauty',
  'Professional Services',
  'Health & Wellness',
  'Technology & Electronics',
  'Other',
];

export default function Explore() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query params or defaults
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialCity = searchParams.get('city') || '';

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
      const categoryParam = selectedCategory !== 'All' ? selectedCategory : '';
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
        'Unable to load businesses. Please check your connection and try again.';
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
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);
    if (cityFilter) params.set('city', cityFilter);
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
    setSearchInput('');
    setSearchTerm('');
    setSelectedCategory('All');
    setCityInput('');
    setCityFilter('');
    setPage(0);
  };

  const hasActiveFilters = Boolean(
    searchTerm || (selectedCategory && selectedCategory !== 'All') || cityFilter
  );

  return (
    <div className="page-wrapper pb-24">
      {/* Top Header */}
      <Header
        title="Business Directory"
        subtitle="Discover township businesses and services"
        showBack={true}
        onBack={() => navigate('/home')}
      />

      <div className="page-content page-padding py-6 max-w-md mx-auto w-full space-y-6">
        {/* Intro */}
        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            Explore Kasi Businesses
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Browse registered local services, artisans, and enterprises in your community.
          </p>
        </div>

        {/* Search & City Filter Form */}
        <Card className="p-4 shadow-sm border-neutral-200">
          <form onSubmit={handleSearchSubmit} className="space-y-3" role="search">
            {/* Search Keyword */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search businesses by name..."
                aria-label="Search businesses by name"
                className="input-field pl-10 pr-9 py-2.5 text-sm bg-neutral-50"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                  aria-label="Clear search keyword"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* City / Township Filter */}
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Filter by township/city (e.g. Soweto)..."
                aria-label="Filter by township or city"
                className="input-field pl-10 pr-9 py-2.5 text-sm bg-neutral-50"
              />
              {cityInput && (
                <button
                  type="button"
                  onClick={() => setCityInput('')}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                  aria-label="Clear city filter"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="flex-1 py-2 text-sm flex items-center justify-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleResetFilters}
                  className="py-2 text-xs text-neutral-600"
                  aria-label="Reset all filters"
                >
                  Reset
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Category Pills Filter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Filter by Category
            </span>
            {selectedCategory !== 'All' && (
              <button
                type="button"
                onClick={() => handleCategorySelect('All')}
                className="text-xs text-kasi-green font-semibold hover:underline"
              >
                Show All
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="Business Categories">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-kasi-green text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                  aria-pressed={isSelected}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter */}
        {!isLoading && !error && (
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
            <span>
              {totalElements} {totalElements === 1 ? 'business' : 'businesses'} listed
            </span>
            {hasActiveFilters && (
              <span className="text-kasi-green font-medium">Filtered</span>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-neutral-500" data-testid="loading-state">
            <LoadingSpinner size="lg" />
            <p className="text-sm">Searching directory...</p>
          </div>
        )}

        {/* Error State with Retry */}
        {!isLoading && error && (
          <Card className="p-6 text-center space-y-3 shadow-sm border-red-200 bg-red-50/50" data-testid="error-state">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h3 className="font-bold text-neutral-900 text-base">Failed to load businesses</h3>
            <p className="text-xs text-neutral-600 max-w-xs mx-auto">{error}</p>
            <Button
              variant="primary"
              size="sm"
              onClick={fetchBusinesses}
              className="mx-auto flex items-center justify-center gap-1.5 text-xs py-2 px-4"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </Button>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && businesses.length === 0 && (
          <Card className="p-8 text-center space-y-4 shadow-sm border-neutral-200" data-testid="empty-state">
            <div className="w-16 h-16 rounded-full bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">No businesses found</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                {hasActiveFilters
                  ? 'No registered businesses match your search or filter criteria.'
                  : 'There are currently no registered businesses on KasiCircle.'}
              </p>
            </div>
            {hasActiveFilters && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetFilters}
                className="mx-auto text-xs py-2 px-4"
              >
                Clear all filters
              </Button>
            )}
          </Card>
        )}

        {/* Business Cards List */}
        {!isLoading && !error && businesses.length > 0 && (
          <div className="space-y-4" data-testid="business-cards-list">
            {businesses.map((biz) => (
              <Card
                key={biz.id}
                className="p-5 shadow-sm border-neutral-200 hover:shadow-md transition-shadow"
                data-testid={`business-card-${biz.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-base text-neutral-900 leading-snug">
                      {biz.name}
                    </h3>
                    <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                      <Tag className="w-3 h-3" />
                      <span>{biz.category}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kasi-green to-kasi-green-dark text-white flex items-center justify-center shadow-xs flex-shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                {/* Description */}
                <p className="mt-2.5 text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                  {biz.description}
                </p>

                {/* Rating Badge */}
                <div
                  className="mt-2.5 flex items-center gap-1.5 text-xs"
                  data-testid={`business-rating-${biz.id}`}
                >
                  {biz.averageRating != null && biz.averageRating > 0 && biz.reviewCount > 0 ? (
                    <>
                      <Star
                        className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span
                        className="font-semibold text-neutral-800"
                        aria-label={`Rated ${Number(biz.averageRating).toFixed(1)} out of 5 stars with ${biz.reviewCount} ${biz.reviewCount === 1 ? 'review' : 'reviews'}`}
                      >
                        {Number(biz.averageRating).toFixed(1)}
                      </span>
                      <span className="text-neutral-500">
                        ({biz.reviewCount} {biz.reviewCount === 1 ? 'review' : 'reviews'})
                      </span>
                    </>
                  ) : (
                    <>
                      <Star
                        className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-neutral-400 italic">No reviews yet</span>
                    </>
                  )}
                </div>

                {/* Location & Action */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <MapPin className="w-3.5 h-3.5 text-kasi-green flex-shrink-0" />
                    <span className="font-medium text-neutral-700">
                      {biz.city}, {biz.province}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/businesses/${biz.id}`)}
                    className="font-bold text-kasi-green hover:text-kasi-green-dark transition-colors inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-kasi-green rounded"
                    aria-label={`View details for ${biz.name}`}
                  >
                    <span>View Details</span>
                  </button>
                </div>
              </Card>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-4 flex items-center justify-between border-t border-neutral-200">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 text-xs py-2 px-3"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>

                <span className="text-xs text-neutral-600 font-medium">
                  Page {page + 1} of {totalPages}
                </span>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 text-xs py-2 px-3"
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, StatCard, Header, LoadingSpinner, Button } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { businessService } from '../services/api';
import {
  Star,
  MessageSquare,
  Award,
  AlertCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShieldCheck,
  Tag,
  Lock,
  ExternalLink,
} from 'lucide-react';

/**
 * Renders 1 to 5 accessible star icons for a given rating.
 */
const renderStarRating = (rating, starSize = 'w-4 h-4', labelSuffix = '') => {
  const roundedRating = Math.round(Number(rating) || 0);
  const displayRating = Number(rating) ? Number(rating).toFixed(1) : '0.0';
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${displayRating} out of 5 stars${labelSuffix ? ` - ${labelSuffix}` : ''}`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${
            star <= roundedRating
              ? 'fill-amber-400 text-amber-400'
              : 'text-neutral-300 fill-neutral-100'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

/**
 * Derives a clean single-letter or two-letter initial from reviewer name.
 */
const getReviewerInitial = (name) => {
  if (!name) return 'KC';
  const clean = name.trim();
  return clean.charAt(0).toUpperCase() || 'KC';
};

/**
 * Formats ISO date string into readable South African date format.
 */
const formatDate = (isoString) => {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

export default function BusinessReviews() {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Business resolution state
  const [isResolvingBusiness, setIsResolvingBusiness] = useState(true);
  const [business, setBusiness] = useState(null);
  const [businessError, setBusinessError] = useState(null);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);

  const isBusinessAccount = (user?.accountType || '').toUpperCase() === 'BUSINESS';

  // 1. Resolve the authenticated owner's business
  const loadBusiness = useCallback(async () => {
    if (!isBusinessAccount) {
      setIsResolvingBusiness(false);
      return;
    }

    setIsResolvingBusiness(true);
    setBusinessError(null);

    try {
      const response = await businessService.getMyBusinesses(0, 1);
      if (response && response.content && response.content.length > 0) {
        setBusiness(response.content[0]);
      } else {
        setBusiness(null);
      }
    } catch (err) {
      const message =
        err.data?.message ||
        err.message ||
        'Unable to load your business listing. Please try again.';
      setBusinessError(message);
      setBusiness(null);
    } finally {
      setIsResolvingBusiness(false);
    }
  }, [isBusinessAccount]);

  useEffect(() => {
    if (user && !isAuthLoading) {
      loadBusiness();
    }
  }, [user, isAuthLoading, loadBusiness]);

  // 2. Fetch reviews and summary for the resolved business
  const fetchReviewsAndSummary = useCallback(async (businessId, pageToFetch = 0) => {
    if (!businessId) return;

    setIsReviewsLoading(true);
    setReviewsError(null);

    try {
      const [reviewsData, summaryData] = await Promise.all([
        businessService.getBusinessReviews(businessId, pageToFetch, 10),
        businessService.getBusinessReviewSummary(businessId).catch((err) => {
          console.warn('Could not load review summary:', err);
          return null;
        }),
      ]);

      if (reviewsData && reviewsData.content) {
        setReviews(reviewsData.content);
        setTotalPages(reviewsData.totalPages || 0);
        setTotalElements(reviewsData.totalElements || 0);
      } else if (Array.isArray(reviewsData)) {
        setReviews(reviewsData);
        setTotalPages(1);
        setTotalElements(reviewsData.length);
      } else {
        setReviews([]);
        setTotalPages(0);
        setTotalElements(0);
      }

      if (summaryData) {
        setReviewSummary(summaryData);
      }
    } catch (err) {
      const message =
        err.data?.message ||
        err.message ||
        'Unable to load customer reviews. Please check your connection and try again.';
      setReviewsError(message);
      setReviews([]);
    } finally {
      setIsReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (business?.id) {
      fetchReviewsAndSummary(business.id, page);
    }
  }, [business?.id, page, fetchReviewsAndSummary]);

  // Handle page navigation
  const handlePrevPage = () => {
    if (page > 0 && !isReviewsLoading) {
      setPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages - 1 && !isReviewsLoading) {
      setPage((prev) => prev + 1);
    }
  };

  // Safe KPI calculations
  const effectiveAverageRating =
    reviewSummary?.averageRating != null
      ? Number(reviewSummary.averageRating)
      : business?.averageRating != null
      ? Number(business.averageRating)
      : 0.0;

  const effectiveTotalReviews =
    reviewSummary?.totalReviews != null
      ? Number(reviewSummary.totalReviews)
      : business?.reviewCount != null
      ? Number(business.reviewCount)
      : totalElements;

  const fiveStarCount = reviewSummary?.fiveStarCount != null ? Number(reviewSummary.fiveStarCount) : 0;

  const starLevels = [
    { stars: 5, count: reviewSummary?.fiveStarCount ?? 0 },
    { stars: 4, count: reviewSummary?.fourStarCount ?? 0 },
    { stars: 3, count: reviewSummary?.threeStarCount ?? 0 },
    { stars: 2, count: reviewSummary?.twoStarCount ?? 0 },
    { stars: 1, count: reviewSummary?.oneStarCount ?? 0 },
  ];

  // ---------------------------------------------------------------------------
  // RENDER: Account Restriction (Non-BUSINESS Account)
  // ---------------------------------------------------------------------------
  if (!isAuthLoading && user && !isBusinessAccount) {
    return (
      <div className="page-wrapper business-feedback reviews-dashboard-page pb-12">
        <Header
        eyebrow="What your community is saying"
          title="Reviews & Feedback"
          subtitle="Owner Review Dashboard"
          showBack={true}
          onBack={() => navigate('/profile')}
        />
        <main className="content-container py-8 md:py-10 space-y-6">
          <Card className="p-6 text-center space-y-4" data-testid="access-restricted-card">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Business Account Required</h2>
              <p className="text-xs text-neutral-500 mt-1">
                The Review Dashboard is available to Business accounts. Your account type is{' '}
                <span className="font-semibold text-neutral-800">{user.accountType || 'RESIDENT'}</span>.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/profile')}
              className="w-full"
            >
              Return to Profile
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Initial Business Resolution Loading State
  // ---------------------------------------------------------------------------
  if (isResolvingBusiness || isAuthLoading) {
    return (
      <div className="page-wrapper business-feedback reviews-dashboard-page pb-12">
        <Header
        eyebrow="What your community is saying"
          title="Reviews & Feedback"
          subtitle="Loading your business review dashboard..."
          showBack={true}
          onBack={() => navigate('/business-profile')}
        />
        <main
          className="page-content page-padding py-16 flex flex-col items-center justify-center gap-3 text-neutral-500"
          data-testid="dashboard-loading"
        >
          <LoadingSpinner size="lg" />
          <p className="text-sm font-medium">Resolving your business listing...</p>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Business Resolution Error State
  // ---------------------------------------------------------------------------
  if (businessError) {
    return (
      <div className="page-wrapper business-feedback reviews-dashboard-page pb-12">
        <Header
        eyebrow="What your community is saying"
          title="Reviews & Feedback"
          subtitle="Owner Review Dashboard"
          showBack={true}
          onBack={() => navigate('/business-profile')}
        />
        <main className="content-container py-8 md:py-10 space-y-6">
          <Card className="p-6 text-center space-y-4 border-red-200 bg-red-50/50" data-testid="dashboard-error">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Unable to Load Dashboard</h2>
              <p className="text-xs text-neutral-600 mt-1">{businessError}</p>
            </div>
            <Button
              variant="primary"
              onClick={loadBusiness}
              className="w-full flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry</span>
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Empty Business State (BUSINESS Account without Registered Business)
  // ---------------------------------------------------------------------------
  if (!business) {
    return (
      <div className="page-wrapper business-feedback reviews-dashboard-page pb-12">
        <Header
        eyebrow="What your community is saying"
          title="Reviews & Feedback"
          subtitle="Owner Review Dashboard"
          showBack={true}
          onBack={() => navigate('/business-profile')}
        />
        <main className="content-container py-8 md:py-10 space-y-6">
          <Card className="p-6 text-center space-y-4" data-testid="no-business-registered">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">No Business Profile Registered</h2>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                You haven&apos;t registered a business profile yet. Register your business listing to start collecting and managing customer reviews.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/business-profile')}
              className="w-full flex items-center justify-center gap-2"
              data-testid="register-business-btn"
            >
              <Building2 className="w-4 h-4" />
              <span>Register Business Profile</span>
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Active Business Review Dashboard
  // ---------------------------------------------------------------------------
  return (
    <div className="page-wrapper business-feedback reviews-dashboard-page pb-12">
      {/* Dashboard Header */}
      <Header
        eyebrow="What your community is saying"
        title="Reviews & Feedback"
        subtitle={`Customer ratings and feedback for ${business.name}`}
        showBack={true}
        onBack={() => navigate('/business-profile')}
      />

      <main className="content-container py-8 md:py-10 space-y-6">
        {/* Business Identity Banner */}
        <Card className="p-4 shadow-sm border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-kasi-green text-white flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-2xl text-neutral-900" data-testid="business-name-heading">
                  {business.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500">
                    <Tag className="w-3 h-3 text-neutral-400" />
                    {business.category}
                  </span>
                  <span className="text-neutral-300">•</span>
                  <span className="text-[11px] text-neutral-500">{business.city}</span>
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3 h-3" /> Active
            </span>
          </div>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="kpi-cards">
          <StatCard
            icon={Star}
            value={effectiveAverageRating > 0 ? effectiveAverageRating.toFixed(1) : '0.0'}
            label="Average Rating"
            bgColor="bg-amber-50/80 border border-amber-200/70"
          />
          <StatCard
            icon={MessageSquare}
            value={effectiveTotalReviews}
            label="Total Reviews"
            bgColor="bg-kasi-green-light border border-neutral-200"
          />
          <StatCard
            icon={Award}
            value={fiveStarCount}
            label="5-Star Reviews"
            bgColor="bg-emerald-50/80 border border-emerald-200/70"
          />
        </div>

        {/* Rating Distribution Card */}
        <Card className="p-5 shadow-sm border-neutral-200 space-y-4" data-testid="rating-distribution-card">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Rating Distribution
            </h2>
            <span className="text-xs text-neutral-500 font-medium">
              {effectiveTotalReviews} {effectiveTotalReviews === 1 ? 'review' : 'reviews'} total
            </span>
          </div>

          {effectiveTotalReviews > 0 ? (
            <div className="space-y-2" data-testid="rating-distribution-bars">
              {starLevels.map((level) => {
                const percentage =
                  effectiveTotalReviews > 0
                    ? Math.round((level.count / effectiveTotalReviews) * 100)
                    : 0;
                return (
                  <div key={level.stars} className="flex items-center gap-2.5 text-xs">
                    <span className="w-12 text-neutral-700 font-medium flex items-center gap-1">
                      <span>{level.stars}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                    </span>
                    <div
                      className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={percentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-label={`${level.stars} stars: ${level.count} reviews`}
                    >
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-neutral-500 font-medium">
                      {level.count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center space-y-1" data-testid="rating-distribution-empty">
              <p className="text-xs font-semibold text-neutral-700">No rating distribution data</p>
              <p className="text-[11px] text-neutral-400">
                Distribution breakdown will appear once customers rate your business.
              </p>
            </div>
          )}
        </Card>

        {/* Customer Feedback Section */}
        <div className="space-y-3" data-testid="customer-reviews-section">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-kasi-green" />
              <h2 className="text-sm font-bold text-neutral-900">Customer Feedback</h2>
            </div>
            {effectiveTotalReviews > 0 && (
              <span className="text-xs text-neutral-500 font-medium">
                {totalElements || effectiveTotalReviews} {effectiveTotalReviews === 1 ? 'review' : 'reviews'}
              </span>
            )}
          </div>

          {/* Reviews Loading State */}
          {isReviewsLoading && (
            <div
              className="py-10 flex flex-col items-center justify-center gap-2 text-neutral-500"
              data-testid="reviews-loading"
            >
              <LoadingSpinner size="md" />
              <p className="text-xs font-medium">Loading customer reviews...</p>
            </div>
          )}

          {/* Reviews Error State */}
          {!isReviewsLoading && reviewsError && (
            <Card
              className="p-5 text-center space-y-3 border-amber-200 bg-amber-50/60"
              data-testid="reviews-error"
            >
              <div className="flex items-center justify-center gap-2 text-amber-800 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{reviewsError}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchReviewsAndSummary(business.id, page)}
                className="text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 mx-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </Button>
            </Card>
          )}

          {/* Empty Reviews State */}
          {!isReviewsLoading && !reviewsError && reviews.length === 0 && (
            <Card className="p-8 text-center space-y-2 border-dashed border-neutral-300" data-testid="empty-reviews-state">
              <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-neutral-800">No customer reviews yet</h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                When customers review your business listing on KasiCircle, their ratings and comments will appear here.
              </p>
            </Card>
          )}

          {/* Reviews List */}
          {!isReviewsLoading && !reviewsError && reviews.length > 0 && (
            <div className="space-y-3" data-testid="reviews-list">
              {reviews.map((rev) => (
                <Card
                  key={rev.id}
                  className="p-4 shadow-sm border-neutral-200 space-y-2.5"
                  data-testid={`review-card-${rev.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-kasi-green text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                        {getReviewerInitial(rev.authorName)}
                      </div>
                      <div>
                        <p
                          className="font-semibold text-xs text-neutral-900"
                          data-testid={`review-author-${rev.id}`}
                        >
                          {rev.authorName || 'KasiCircle Member'}
                        </p>
                        <p
                          className="text-[11px] text-neutral-400"
                          data-testid={`review-date-${rev.id}`}
                        >
                          {formatDate(rev.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div data-testid={`review-stars-${rev.id}`}>
                      {renderStarRating(rev.rating, 'w-3.5 h-3.5', `${rev.rating} stars`)}
                    </div>
                  </div>

                  {rev.comment && rev.comment.trim() && (
                    <p
                      className="text-xs text-neutral-700 leading-relaxed pt-1 border-t border-neutral-100 whitespace-pre-line"
                      data-testid={`review-comment-${rev.id}`}
                    >
                      {rev.comment}
                    </p>
                  )}
                </Card>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div
                  className="pt-2 flex items-center justify-between text-xs"
                  data-testid="pagination-controls"
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={page === 0 || isReviewsLoading}
                    className="flex items-center gap-1 text-xs py-1.5 px-3"
                    data-testid="pagination-prev"
                    aria-label="Previous page of reviews"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </Button>

                  <span
                    className="text-neutral-500 font-medium"
                    data-testid="pagination-info"
                  >
                    Page {page + 1} of {totalPages}
                  </span>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page >= totalPages - 1 || isReviewsLoading}
                    className="flex items-center gap-1 text-xs py-1.5 px-3"
                    data-testid="pagination-next"
                    aria-label="Next page of reviews"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Navigation Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/business-profile')}
            className="flex-1 flex items-center justify-center gap-2 text-neutral-700"
            data-testid="back-to-profile-btn"
          >
            <Building2 className="w-4 h-4" />
            <span>Manage Business Profile</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate(`/businesses/${business.id}`)}
            className="flex-1 flex items-center justify-center gap-2 text-neutral-700"
            data-testid="view-public-page-btn"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Public Page</span>
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
    </div>
  );
}

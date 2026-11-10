import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Header, BottomNavigation, LoadingSpinner } from '../components';
import { businessService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ReportForm from '../components/ReportForm';
import {
  Building2,
  MapPin,
  Tag,
  Phone,
  Mail,
  Share2,
  Check,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Calendar,
  ArrowLeft,
  Image as ImageIcon,
  Camera,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Edit3,
  Trash2,
} from 'lucide-react';

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

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [business, setBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Gallery state
  const [images, setImages] = useState([]);
  const [isImagesLoading, setIsImagesLoading] = useState(true);
  const [imagesError, setImagesError] = useState(null);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(0);
  const [reviewTotalElements, setReviewTotalElements] = useState(0);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);

  // Review management state
  const [myReview, setMyReview] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formComment, setFormComment] = useState('');
  const [formValidationErrors, setFormValidationErrors] = useState({});
  const [formApiError, setFormApiError] = useState(null);
  const [formSuccessMessage, setFormSuccessMessage] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Review delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchBusiness = useCallback(async () => {
    if (!id) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsNotFound(false);

    try {
      const data = await businessService.getBusinessById(id);
      if (!data) {
        setIsNotFound(true);
      } else {
        setBusiness(data);
      }
    } catch (err) {
      const is404 =
        err.status === 404 ||
        err.statusCode === 404 ||
        (typeof err.message === 'string' && err.message.includes('404')) ||
        (err.data && (err.data.status === 404 || err.data.error === 'Not Found'));

      if (is404) {
        setIsNotFound(true);
      } else {
        const message =
          err.data?.message ||
          err.message ||
          'Failed to load business details. Please check your connection and try again.';
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchImages = useCallback(async () => {
    if (!id || typeof businessService.getBusinessImages !== 'function') {
      setIsImagesLoading(false);
      return;
    }

    setIsImagesLoading(true);
    setImagesError(null);

    try {
      const data = await businessService.getBusinessImages(id);
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err.data?.message ||
        err.message ||
        'Unable to load business gallery photos.';
      setImagesError(message);
      setImages([]);
    } finally {
      setIsImagesLoading(false);
    }
  }, [id]);

  const fetchReviewsAndSummary = useCallback(async (pageToFetch = 0) => {
    if (!id || typeof businessService.getBusinessReviews !== 'function') {
      setIsReviewsLoading(false);
      return;
    }

    setIsReviewsLoading(true);
    setReviewsError(null);

    try {
      const [reviewsData, summaryData] = await Promise.all([
        businessService.getBusinessReviews(id, pageToFetch, 10),
        businessService.getBusinessReviewSummary(id).catch((err) => {
          console.warn('Could not load review summary:', err);
          return null;
        }),
      ]);

      if (reviewsData && reviewsData.content) {
        setReviews(reviewsData.content);
        setReviewTotalPages(reviewsData.totalPages || 0);
        setReviewTotalElements(reviewsData.totalElements || 0);
      } else if (Array.isArray(reviewsData)) {
        setReviews(reviewsData);
        setReviewTotalPages(1);
        setReviewTotalElements(reviewsData.length);
      } else {
        setReviews([]);
        setReviewTotalPages(0);
        setReviewTotalElements(0);
      }

      if (summaryData) {
        setReviewSummary(summaryData);
      }
    } catch (err) {
      const message =
        err.data?.message ||
        err.message ||
        'Unable to load customer reviews.';
      setReviewsError(message);
      setReviews([]);
    } finally {
      setIsReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBusiness();
    fetchImages();
  }, [fetchBusiness, fetchImages]);

  useEffect(() => {
    fetchReviewsAndSummary(reviewPage);
  }, [fetchReviewsAndSummary, reviewPage]);

  // Keyboard navigation and body scroll locking for lightbox
  useEffect(() => {
    if (activeLightboxIndex === null) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveLightboxIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeLightboxIndex, images.length]);

  const fetchMyReview = useCallback(async () => {
    if (!id || !isAuthenticated || !business || typeof businessService.getMyReview !== 'function') {
      if (!isAuthenticated) setMyReview(null);
      return;
    }

    if (business.ownerId && user?.id && String(business.ownerId) === String(user.id)) {
      setMyReview(null);
      return;
    }

    try {
      const data = await businessService.getMyReview(id);
      setMyReview(data || null);
    } catch (err) {
      setMyReview(null);
    }
  }, [id, isAuthenticated, business, user?.id]);

  useEffect(() => {
    fetchMyReview();
  }, [fetchMyReview]);

  const handleOpenCreateForm = () => {
    setFormRating(0);
    setHoverRating(0);
    setFormComment('');
    setFormValidationErrors({});
    setFormApiError(null);
    setFormSuccessMessage(null);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = () => {
    if (!myReview) return;
    setFormRating(myReview.rating || 0);
    setHoverRating(0);
    setFormComment(myReview.comment || '');
    setFormValidationErrors({});
    setFormApiError(null);
    setFormSuccessMessage(null);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormRating(0);
    setHoverRating(0);
    setFormComment('');
    setFormValidationErrors({});
    setFormApiError(null);
    setIsEditing(false);
  };

  const handleSubmitReview = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setFormValidationErrors({});
    setFormApiError(null);
    setFormSuccessMessage(null);

    const errors = {};
    if (!formRating || formRating < 1 || formRating > 5) {
      errors.rating = 'Please select a rating between 1 and 5 stars.';
    }
    if (formComment && formComment.length > 1000) {
      errors.comment = 'Comment cannot exceed 1000 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFormValidationErrors(errors);
      return;
    }

    setIsSubmittingReview(true);
    try {
      const payload = {
        rating: Number(formRating),
        comment: formComment.trim() ? formComment.trim() : null,
      };

      let result;
      if (isEditing && myReview?.id) {
        result = await businessService.updateReview(id, myReview.id, payload);
        setFormSuccessMessage('Your review has been updated successfully.');
      } else {
        result = await businessService.createReview(id, payload);
        setFormSuccessMessage('Your review has been submitted successfully.');
      }

      setMyReview(result);
      setIsFormOpen(false);

      fetchReviewsAndSummary(reviewPage);
      fetchBusiness();
    } catch (err) {
      const message =
        err.data?.message ||
        err.message ||
        'Failed to save your review. Please try again.';
      setFormApiError(message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleOpenDeleteDialog = () => {
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (isDeletingReview) return;
    setIsDeleteDialogOpen(false);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!myReview?.id) return;
    setIsDeletingReview(true);
    setDeleteError(null);

    try {
      await businessService.deleteReview(id, myReview.id);
      setMyReview(null);
      setIsDeleteDialogOpen(false);
      setFormSuccessMessage('Your review has been deleted.');

      if (reviews.length === 1 && reviewPage > 0) {
        setReviewPage((prev) => Math.max(0, prev - 1));
      } else {
        fetchReviewsAndSummary(reviewPage);
      }
      fetchBusiness();
    } catch (err) {
      const message =
        err.data?.message ||
        err.message ||
        'Failed to delete your review. Please try again.';
      setDeleteError(message);
    } finally {
      setIsDeletingReview(false);
    }
  };

  const handleRetryAll = () => {
    fetchBusiness();
    fetchImages();
    fetchReviewsAndSummary(reviewPage);
    fetchMyReview();
  };

  const isOwner = Boolean(
    isAuthenticated &&
    user?.id &&
    business?.ownerId &&
    String(user.id) === String(business.ownerId)
  );

  const effectiveAverageRating =
    reviewSummary?.averageRating != null
      ? Number(reviewSummary.averageRating)
      : (business?.averageRating != null ? Number(business.averageRating) : 0.0);

  const effectiveTotalReviews =
    reviewSummary?.totalReviews != null
      ? Number(reviewSummary.totalReviews)
      : (business?.reviewCount != null ? Number(business.reviewCount) : reviewTotalElements);

  const starLevels = [
    { stars: 5, count: reviewSummary?.fiveStarCount ?? 0 },
    { stars: 4, count: reviewSummary?.fourStarCount ?? 0 },
    { stars: 3, count: reviewSummary?.threeStarCount ?? 0 },
    { stars: 2, count: reviewSummary?.twoStarCount ?? 0 },
    { stars: 1, count: reviewSummary?.oneStarCount ?? 0 },
  ];

  const coverImage = images.find((img) => img.isCover) || (images.length > 0 ? images[0] : null);
  const effectiveCoverUrl = coverImage?.imageUrl || business?.coverImageUrl || null;

  const displayImages = images.length > 0
    ? images
    : (effectiveCoverUrl
        ? [{ id: 'cover-only', imageUrl: effectiveCoverUrl, isCover: true, fileName: 'Cover photo' }]
        : []);

  const currentLightboxImage =
    activeLightboxIndex !== null && activeLightboxIndex >= 0 && activeLightboxIndex < displayImages.length
      ? displayImages[activeLightboxIndex]
      : null;

  const openLightbox = (index) => {
    setActiveLightboxIndex(index);
  };

  const closeLightbox = () => {
    setActiveLightboxIndex(null);
  };

  const nextLightboxImage = () => {
    if (displayImages.length <= 1) return;
    setActiveLightboxIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0));
  };

  const prevLightboxImage = () => {
    if (displayImages.length <= 1) return;
    setActiveLightboxIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1));
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: business?.name ? `${business.name} | KasiCircle` : 'KasiCircle Business',
          text: business?.name
            ? `Check out ${business.name} on KasiCircle:`
            : 'Check out this business on KasiCircle:',
          url,
        });
        return;
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback: Copy current URL to clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    } catch (clipErr) {
      console.error('Failed to copy to clipboard', clipErr);
    }
  };

  return (
    <div className="page-wrapper pb-24">
      {/* Header */}
      <Header
        title="Business Details"
        subtitle="KasiCircle Enterprise Listing"
        showBack={true}
        onBack={() => navigate('/businesses')}
      />

      <div className="page-content page-padding py-6 max-w-md mx-auto w-full space-y-5">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/businesses')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-kasi-green hover:text-kasi-green-dark transition-colors focus:outline-none focus:ring-2 focus:ring-kasi-green rounded-md px-1 py-0.5"
            aria-label="Back to business directory"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to directory</span>
          </button>

          {business && (
            <button
              type="button"
              onClick={handleShare}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-kasi-green ${
                copyFeedback
                  ? 'bg-green-50 text-green-700 border-green-300'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
              aria-label="Share business"
            >
              {copyFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Share</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Copy confirmation toast */}
        {copyFeedback && (
          <div
            role="status"
            className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center gap-2 animate-in fade-in"
          >
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>Business link copied to clipboard! You can now share it.</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div
            className="py-16 flex flex-col items-center justify-center gap-3 text-neutral-500"
            data-testid="loading-state"
          >
            <LoadingSpinner size="lg" />
            <p className="text-sm font-medium">Loading business profile...</p>
          </div>
        )}

        {/* 404 / Not Found State */}
        {!isLoading && isNotFound && (
          <Card
            className="p-8 text-center space-y-4 shadow-sm border-neutral-200"
            data-testid="not-found-state"
          >
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Business Not Found</h2>
              <p className="text-xs text-neutral-600 mt-1.5 max-w-xs mx-auto leading-relaxed">
                The business listing you are looking for does not exist or may have been removed.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/businesses')}
                className="mx-auto text-xs py-2.5 px-5"
              >
                Browse Business Directory
              </Button>
            </div>
          </Card>
        )}

        {/* General Error State with Retry */}
        {!isLoading && !isNotFound && error && (
          <Card
            className="p-6 text-center space-y-3 shadow-sm border-red-200 bg-red-50/50"
            data-testid="error-state"
          >
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h2 className="font-bold text-neutral-900 text-base">Failed to load business</h2>
            <p className="text-xs text-neutral-600 max-w-xs mx-auto">{error}</p>
            <div className="flex gap-2 justify-center pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={handleRetryAll}
                className="flex items-center justify-center gap-1.5 text-xs py-2 px-4"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/businesses')}
                className="text-xs py-2 px-4"
              >
                Directory
              </Button>
            </div>
          </Card>
        )}

        {/* Business Information */}
        {!isLoading && !isNotFound && !error && business && (
          <div className="space-y-5" data-testid="business-detail-content">
            {/* Prominent Cover Image / Hero Banner */}
            {effectiveCoverUrl ? (
              <div
                className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden shadow-sm border border-neutral-200 group cursor-pointer bg-neutral-100"
                data-testid="business-cover-image"
                onClick={() => {
                  const idx = displayImages.findIndex((img) => img.imageUrl === effectiveCoverUrl);
                  openLightbox(idx >= 0 ? idx : 0);
                }}
              >
                <img
                  src={effectiveCoverUrl}
                  alt={`${business.name} cover photo`}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-xs flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Cover Photo</span>
                  </span>
                  {images.length > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{images.length} {images.length === 1 ? 'photo' : 'photos'}</span>
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white p-1.5 rounded-full backdrop-blur-xs">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <div
                className="relative w-full h-32 sm:h-40 rounded-2xl overflow-hidden border border-neutral-200 bg-gradient-to-br from-kasi-green-light via-neutral-50 to-neutral-100 flex flex-col items-center justify-center p-4 text-center"
                data-testid="business-cover-placeholder"
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-kasi-green/20 text-kasi-green flex items-center justify-center mb-1.5">
                  <Building2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-neutral-800 tracking-wide uppercase">
                  Township Enterprise
                </p>
                <p className="text-[11px] text-neutral-500">
                  Verified Business Listing
                </p>
              </div>
            )}

            {/* Main Business Profile Card */}
            <Card className="p-6 shadow-sm border-neutral-200 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
                    {business.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                      <Tag className="w-3 h-3" />
                      <span>{business.category}</span>
                    </div>

                    {effectiveTotalReviews > 0 ? (
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                        data-testid="header-rating-badge"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{effectiveAverageRating.toFixed(1)}</span>
                        <span className="text-amber-700/80 font-normal">
                          ({effectiveTotalReviews})
                        </span>
                      </div>
                    ) : (
                      <div
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200"
                        data-testid="header-rating-badge"
                      >
                        <Star className="w-3 h-3 text-neutral-400" />
                        <span>No reviews yet</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-kasi-green to-kasi-green-dark text-white flex items-center justify-center shadow-md flex-shrink-0">
                  <Building2 className="w-7 h-7" />
                </div>
              </div>

              {/* Quick Location Badge */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-600 pt-1">
                <MapPin className="w-4 h-4 text-kasi-green flex-shrink-0" />
                <span className="font-medium text-neutral-800">
                  {business.city}, {business.province}
                </span>
              </div>
            </Card>

            {/* About Card */}
            <Card className="p-6 shadow-sm border-neutral-200 space-y-2">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                About the Business
              </h2>
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                {business.description}
              </p>
            </Card>
            <ReportForm targetType="BUSINESS" targetId={business.id} />

            {/* Photos & Gallery Card */}
            <Card className="p-6 shadow-sm border-neutral-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-kasi-green" />
                  <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Photos & Gallery
                  </h2>
                </div>
                {!isImagesLoading && !imagesError && images.length > 0 && (
                  <span className="text-xs text-neutral-500 font-medium">
                    {images.length} {images.length === 1 ? 'photo' : 'photos'}
                  </span>
                )}
              </div>

              {/* Gallery Loading State */}
              {isImagesLoading && (
                <div
                  className="py-8 flex flex-col items-center justify-center gap-2 text-neutral-500"
                  data-testid="gallery-loading"
                >
                  <LoadingSpinner size="md" />
                  <p className="text-xs font-medium">Loading photos...</p>
                </div>
              )}

              {/* Gallery Error State */}
              {!isImagesLoading && imagesError && (
                <div
                  className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2"
                  data-testid="gallery-error"
                >
                  <div className="flex items-center justify-center gap-1.5 text-amber-700 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Failed to load gallery photos</span>
                  </div>
                  <p className="text-xs text-neutral-600 max-w-xs mx-auto">
                    {imagesError}
                  </p>
                  <button
                    type="button"
                    onClick={fetchImages}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-kasi-green hover:underline focus:outline-none focus:ring-2 focus:ring-kasi-green rounded px-2 py-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry photos</span>
                  </button>
                </div>
              )}

              {/* Gallery Empty State (No Photos) */}
              {!isImagesLoading && !imagesError && images.length === 0 && (
                <div
                  className="p-6 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-300 space-y-2"
                  data-testid="gallery-empty"
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-200/60 text-neutral-400 mx-auto flex items-center justify-center">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-neutral-800">No photos uploaded yet</p>
                  <p className="text-[11px] text-neutral-500 max-w-xs mx-auto leading-relaxed">
                    This business has not shared any gallery photos yet. Check back soon for storefront and product photos!
                  </p>
                </div>
              )}

              {/* Gallery Grid */}
              {!isImagesLoading && !imagesError && images.length > 0 && (
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
                  data-testid="business-image-gallery"
                >
                  {images.map((img, index) => {
                    const altText = img.fileName
                      ? `${business.name} - ${img.fileName}`
                      : `${business.name} photo ${index + 1}`;
                    return (
                      <button
                        key={img.id || index}
                        type="button"
                        onClick={() => openLightbox(index)}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-kasi-green transition-transform active:scale-95 text-left"
                        data-testid={`gallery-image-${img.id || index}`}
                        aria-label={`View photo ${index + 1} of ${images.length}: ${altText}`}
                      >
                        <img
                          src={img.imageUrl}
                          alt={altText}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                        {img.isCover && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-kasi-green text-white shadow-xs">
                            Cover
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Ratings & Customer Reviews Card */}
            <Card className="p-6 shadow-sm border-neutral-200 space-y-5" data-testid="business-reviews-section">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Ratings & Reviews
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {effectiveTotalReviews > 0 && (
                    <span className="text-xs text-neutral-500 font-medium" data-testid="total-reviews-count">
                      {effectiveTotalReviews} {effectiveTotalReviews === 1 ? 'review' : 'reviews'}
                    </span>
                  )}
                  {isAuthenticated && !isOwner && !myReview && !isFormOpen && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleOpenCreateForm}
                      className="text-xs py-1.5 px-3 flex items-center gap-1.5"
                      data-testid="write-review-btn"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>Write a Review</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Overall Rating Summary & Star Distribution */}
              <div
                className="bg-neutral-50/70 p-4 rounded-xl border border-neutral-100 space-y-4"
                data-testid="rating-summary-card"
              >
                {effectiveTotalReviews > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
                    {/* Big Score Block */}
                    <div className="text-center sm:text-left flex-shrink-0">
                      <div className="text-3xl font-extrabold text-neutral-900 leading-none" data-testid="average-rating-value">
                        {effectiveAverageRating.toFixed(1)}
                        <span className="text-base font-medium text-neutral-500">/5</span>
                      </div>
                      <div className="mt-2 flex items-center justify-center sm:justify-start">
                        {renderStarRating(effectiveAverageRating, 'w-4 h-4')}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1.5">
                        Based on {effectiveTotalReviews} {effectiveTotalReviews === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>

                    {/* 1-5 Star Breakdown Bars */}
                    <div className="flex-1 w-full max-w-xs space-y-1.5" data-testid="rating-distribution">
                      {starLevels.map((level) => {
                        const percentage = effectiveTotalReviews > 0
                          ? Math.round((level.count / effectiveTotalReviews) * 100)
                          : 0;
                        return (
                          <div key={level.stars} className="flex items-center gap-2 text-xs">
                            <span className="w-10 text-neutral-600 font-medium flex items-center gap-1">
                              <span>{level.stars}</span>
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            </span>
                            <div
                              className="flex-1 h-2 bg-neutral-200/70 rounded-full overflow-hidden"
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
                            <span className="w-8 text-right text-neutral-500 font-medium">
                              {level.count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 space-y-1.5" data-testid="rating-summary-empty">
                    <div className="flex items-center justify-center gap-1 text-neutral-300">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-5 h-5 fill-neutral-100 text-neutral-300" />
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-neutral-800">No ratings yet</p>
                    <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                      This business does not have any customer ratings yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Anonymous Visitor Login Prompt */}
              {!isAuthenticated && (
                <div
                  className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
                  data-testid="review-login-prompt"
                >
                  <div className="flex items-center gap-2 text-neutral-800">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                    <span>Have you visited this business? Please log in to share your review and rating.</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="text-xs py-1.5 px-3 font-semibold whitespace-nowrap"
                    data-testid="review-login-btn"
                  >
                    Log In to Review
                  </Button>
                </div>
              )}

              {/* Success Notification */}
              {formSuccessMessage && (
                <div
                  className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center justify-between gap-2"
                  data-testid="review-success-message"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>{formSuccessMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormSuccessMessage(null)}
                    className="text-neutral-400 hover:text-neutral-600"
                    aria-label="Dismiss message"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* User's Own Review Display */}
              {myReview && !isFormOpen && (
                <div
                  className="p-4 rounded-xl border border-kasi-green/40 bg-kasi-green-light/20 space-y-2.5 text-left"
                  data-testid="my-review-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold bg-kasi-green text-white px-2 py-0.5 rounded-full">
                        Your Review
                      </span>
                      {myReview.createdAt && (
                        <span className="text-[10px] text-neutral-500">
                          {new Date(myReview.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleOpenEditForm}
                        className="text-xs py-1 px-2.5 flex items-center gap-1 text-neutral-700"
                        data-testid="edit-review-btn"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleOpenDeleteDialog}
                        className="text-xs py-1 px-2.5 flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        data-testid="delete-review-btn"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {renderStarRating(myReview.rating, 'w-3.5 h-3.5')}
                    <span className="text-xs font-semibold text-neutral-800">
                      {myReview.rating} of 5 stars
                    </span>
                  </div>

                  {myReview.comment ? (
                    <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-line" data-testid="my-review-comment">
                      {myReview.comment}
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-400 italic">No comment provided.</p>
                  )}
                </div>
              )}

              {/* Review Form (Create or Edit) */}
              {isFormOpen && (
                <form
                  onSubmit={handleSubmitReview}
                  className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/80 space-y-3.5 text-left"
                  data-testid="review-form"
                >
                  <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
                    <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                      {isEditing ? 'Edit Your Review' : 'Write a Review'}
                    </h3>
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="text-neutral-400 hover:text-neutral-600"
                      aria-label="Close review form"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Interactive 1-5 Star Selector */}
                  <div className="space-y-1.5" data-testid="star-rating-selector">
                    <label className="block text-xs font-semibold text-neutral-700">
                      Your Rating <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = star <= (hoverRating || formRating);
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => {
                              setFormRating(star);
                              if (formValidationErrors.rating) {
                                setFormValidationErrors((prev) => ({ ...prev, rating: null }));
                              }
                            }}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 rounded-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-amber-400"
                            aria-label={`${star} star${star > 1 ? 's' : ''}`}
                            data-testid={`star-select-${star}`}
                          >
                            <Star
                              className={`w-7 h-7 ${
                                isFilled
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-neutral-300 fill-neutral-100 hover:text-amber-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                      <span className="ml-2 text-xs font-semibold text-neutral-600" data-testid="selected-rating-label">
                        {formRating > 0 ? `${formRating} of 5 stars` : 'Select rating'}
                      </span>
                    </div>
                    {formValidationErrors.rating && (
                      <p className="text-xs text-red-600 font-medium" data-testid="review-rating-error">
                        {formValidationErrors.rating}
                      </p>
                    )}
                  </div>

                  {/* Comment Textarea & Character Counter */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="review-comment" className="block text-xs font-semibold text-neutral-700">
                        Review Comment <span className="text-neutral-400 font-normal">(optional)</span>
                      </label>
                      <span
                        className={`text-xs ${
                          formComment.length > 1000 ? 'text-red-600 font-bold' : 'text-neutral-400'
                        }`}
                        data-testid="character-counter"
                      >
                        {formComment.length}/1000 characters
                      </span>
                    </div>
                    <textarea
                      id="review-comment"
                      rows={4}
                      value={formComment}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormComment(val);
                        if (formValidationErrors.comment && val.length <= 1000) {
                          setFormValidationErrors((prev) => ({ ...prev, comment: null }));
                        }
                      }}
                      placeholder="Share details of your experience with this business..."
                      className={`w-full text-xs p-3 rounded-lg border bg-white focus:outline-none focus:ring-2 transition-all ${
                        formValidationErrors.comment
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-neutral-200 focus:ring-kasi-green'
                      }`}
                      data-testid="review-comment-input"
                    />
                    {formValidationErrors.comment && (
                      <p className="text-xs text-red-600 font-medium" data-testid="review-comment-error">
                        {formValidationErrors.comment}
                      </p>
                    )}
                  </div>

                  {/* Error message alert */}
                  {(formApiError || formValidationErrors.rating || formValidationErrors.comment) && (
                    <div
                      className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2"
                      data-testid="review-form-error"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{formApiError || formValidationErrors.rating || formValidationErrors.comment}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200/60">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleCloseForm}
                      disabled={isSubmittingReview}
                      className="text-xs py-2 px-3.5"
                      data-testid="cancel-review-btn"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isSubmittingReview}
                      className="text-xs py-2 px-4 flex items-center gap-1.5"
                      data-testid="submit-review-btn"
                    >
                      {isSubmittingReview ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>{isEditing ? 'Updating...' : 'Submitting...'}</span>
                        </>
                      ) : (
                        <span>{isEditing ? 'Update Review' : 'Submit Review'}</span>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* Review List Section */}
              {isReviewsLoading && (
                <div
                  className="py-8 flex flex-col items-center justify-center gap-2 text-neutral-500"
                  data-testid="reviews-loading"
                >
                  <LoadingSpinner size="md" />
                  <p className="text-xs font-medium">Loading customer reviews...</p>
                </div>
              )}

              {!isReviewsLoading && reviewsError && (
                <div
                  className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2"
                  data-testid="reviews-error"
                >
                  <div className="flex items-center justify-center gap-1.5 text-amber-700 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Failed to load customer reviews</span>
                  </div>
                  <p className="text-xs text-neutral-600 max-w-xs mx-auto">
                    {reviewsError}
                  </p>
                  <button
                    type="button"
                    onClick={() => fetchReviewsAndSummary(reviewPage)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-kasi-green hover:underline focus:outline-none focus:ring-2 focus:ring-kasi-green rounded px-2 py-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry reviews</span>
                  </button>
                </div>
              )}

              {!isReviewsLoading && !reviewsError && reviews.length === 0 && (
                <div
                  className="p-6 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-300 space-y-2"
                  data-testid="reviews-empty"
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-200/60 text-neutral-400 mx-auto flex items-center justify-center">
                    <Star className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-neutral-800">No reviews yet</p>
                  <p className="text-[11px] text-neutral-500 max-w-xs mx-auto leading-relaxed">
                    Be the first to share your experience with {business.name}!
                  </p>
                </div>
              )}

              {!isReviewsLoading && !reviewsError && reviews.length > 0 && (
                <div className="space-y-3" data-testid="customer-reviews-list">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl border border-neutral-200/80 bg-white shadow-2xs space-y-2 text-left"
                      data-testid={`review-item-${rev.id}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-kasi-green-light text-kasi-green font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {rev.authorName ? rev.authorName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-neutral-900 block truncate" data-testid="review-author-name">
                              {rev.authorName || 'Anonymous Member'}
                            </span>
                            {rev.createdAt && (
                              <span className="text-[10px] text-neutral-500 block" data-testid="review-created-at">
                                {new Date(rev.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center flex-shrink-0">
                          {renderStarRating(rev.rating, 'w-3.5 h-3.5')}
                        </div>
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-line pt-1" data-testid="review-comment">
                          {rev.comment}
                        </p>
                      )}
                      {isAuthenticated && <ReportForm targetType="BUSINESS_REVIEW" targetId={rev.id} />}
                    </div>
                  ))}

                  {/* Pagination Controls */}
                  {reviewTotalPages > 1 && (
                    <div
                      className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs"
                      data-testid="reviews-pagination"
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={reviewPage === 0 || isReviewsLoading}
                        onClick={() => setReviewPage((prev) => Math.max(0, prev - 1))}
                        className="py-1.5 px-3 text-xs flex items-center gap-1"
                        aria-label="Previous reviews page"
                        data-testid="reviews-prev-page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </Button>
                      <span className="text-neutral-500 font-medium" data-testid="reviews-page-indicator">
                        Page {reviewPage + 1} of {reviewTotalPages}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={reviewPage >= reviewTotalPages - 1 || isReviewsLoading}
                        onClick={() => setReviewPage((prev) => prev + 1)}
                        className="py-1.5 px-3 text-xs flex items-center gap-1"
                        aria-label="Next reviews page"
                        data-testid="reviews-next-page"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Location Details Card */}
            <Card className="p-6 shadow-sm border-neutral-200 space-y-3">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Location
              </h2>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block text-xs text-neutral-500 font-medium">Physical Address</span>
                  <span className="text-neutral-900 font-medium">
                    {business.address}, {business.city}, {business.province}
                  </span>
                </div>
              </div>
            </Card>

            {/* Contact Information & Action Card */}
            <Card className="p-6 shadow-sm border-neutral-200 space-y-4">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Contact Details
              </h2>

              <div className="space-y-3 text-sm">
                {business.phoneNumber && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="block text-xs text-neutral-500 font-medium">Phone Number</span>
                      <a
                        href={`tel:${business.phoneNumber}`}
                        className="text-kasi-green font-semibold hover:underline inline-block focus:outline-none focus:ring-2 focus:ring-kasi-green rounded"
                        aria-label={`Call ${business.name} at ${business.phoneNumber}`}
                      >
                        {business.phoneNumber}
                      </a>
                    </div>
                  </div>
                )}

                {business.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="block text-xs text-neutral-500 font-medium">Email Address</span>
                      <a
                        href={`mailto:${business.email}`}
                        className="text-kasi-green font-semibold hover:underline inline-block break-all focus:outline-none focus:ring-2 focus:ring-kasi-green rounded"
                        aria-label={`Email ${business.name} at ${business.email}`}
                      >
                        {business.email}
                      </a>
                    </div>
                  </div>
                )}

                {business.createdAt && (
                  <div className="flex items-start gap-3 pt-2 border-t border-neutral-100 text-xs text-neutral-500">
                    <Calendar className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span>Registered on {new Date(business.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Action Contact Buttons */}
              {(business.phoneNumber || business.email) && (
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  {business.phoneNumber && (
                    <a
                      href={`tel:${business.phoneNumber}`}
                      className="flex-1 btn-primary py-2.5 px-4 text-sm font-semibold rounded-full flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kasi-green"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call Now</span>
                    </a>
                  )}

                  {business.email && (
                    <a
                      href={`mailto:${business.email}`}
                      className="flex-1 btn-secondary py-2.5 px-4 text-sm font-semibold rounded-full flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Send Email</span>
                    </a>
                  )}
                </div>
              )}
            </Card>

            {/* Secondary actions: Share & Directory */}
            <div className="pt-1 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShare}
                className="flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 text-neutral-700"
              >
                {copyFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Business</span>
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/businesses')}
                className="flex-1 py-2.5 text-xs text-neutral-600"
              >
                Browse More
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Bottom Navigation */}
      <BottomNavigation active="explore" onNavigate={(path) => navigate(path)} />

      {/* Lightbox Modal */}
      {activeLightboxIndex !== null && currentLightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox view"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col justify-between p-4 animate-in fade-in duration-200"
          data-testid="image-lightbox"
          onClick={closeLightbox}
        >
          {/* Top Header Bar */}
          <div
            className="flex items-center justify-between text-white w-full max-w-4xl mx-auto z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold text-white/80 bg-white/10 px-2.5 py-1 rounded-full"
                data-testid="lightbox-counter"
              >
                {activeLightboxIndex + 1} of {displayImages.length}
              </span>
              {currentLightboxImage.isCover && (
                <span className="text-xs font-bold bg-kasi-green text-white px-2.5 py-1 rounded-full">
                  Cover Photo
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={closeLightbox}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close image preview"
              data-testid="lightbox-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Viewport */}
          <div
            className="relative flex-1 flex items-center justify-center max-w-4xl mx-auto w-full my-2 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Button */}
            {displayImages.length > 1 && (
              <button
                type="button"
                onClick={prevLightboxImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors focus:outline-none focus:ring-2 focus:ring-white z-10"
                aria-label="Previous photo"
                data-testid="lightbox-prev"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Main Image */}
            <img
              src={currentLightboxImage.imageUrl}
              alt={
                currentLightboxImage.fileName
                  ? `${business?.name || 'Business'} - ${currentLightboxImage.fileName}`
                  : `${business?.name || 'Business'} photo ${activeLightboxIndex + 1}`
              }
              className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl select-none"
              data-testid="lightbox-image"
            />

            {/* Next Button */}
            {displayImages.length > 1 && (
              <button
                type="button"
                onClick={nextLightboxImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors focus:outline-none focus:ring-2 focus:ring-white z-10"
                aria-label="Next photo"
                data-testid="lightbox-next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Caption Bar */}
          <div
            className="text-center text-white/70 text-xs py-2 w-full max-w-4xl mx-auto z-10 truncate px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {currentLightboxImage.fileName || business?.name}
          </div>
        </div>
      )}

      {/* Review Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm review deletion"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          data-testid="delete-review-dialog"
        >
          <Card className="p-6 max-w-sm w-full space-y-4 shadow-xl border-neutral-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 text-sm">Delete Review?</h4>
                <p className="text-xs text-neutral-500">
                  Are you sure you want to delete your review? This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <div
                className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700"
                data-testid="delete-review-error"
              >
                {deleteError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCloseDeleteDialog}
                disabled={isDeletingReview}
                className="flex-1 text-xs py-2"
                data-testid="cancel-delete-review-btn"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeletingReview}
                className="flex-1 text-xs py-2 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1.5"
                data-testid="confirm-delete-review-btn"
              >
                {isDeletingReview ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Review</span>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

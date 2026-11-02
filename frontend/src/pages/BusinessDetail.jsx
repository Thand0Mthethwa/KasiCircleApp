import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Header, BottomNavigation, LoadingSpinner } from '../components';
import { businessService } from '../services/api';
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
} from 'lucide-react';

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

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

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

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
                onClick={fetchBusiness}
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
            {/* Main Business Profile Card */}
            <Card className="p-6 shadow-sm border-neutral-200 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
                    {business.name}
                  </h1>
                  <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                    <Tag className="w-3 h-3" />
                    <span>{business.category}</span>
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
    </div>
  );
}


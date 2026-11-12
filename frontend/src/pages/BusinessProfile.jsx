import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Header, LoadingSpinner } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { businessService } from '../services/api';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Tag,
  CheckCircle2,
  AlertCircle,
  Lock,
  Calendar,
  ShieldCheck,
  Edit3,
  ExternalLink,
  Image as ImageIcon,
  Upload,
  Trash2,
  Star,
  RotateCcw,
  X,
} from 'lucide-react';

const CATEGORIES = [
  'Retail',
  'Food & Beverage',
  'Automotive',
  'Construction & Hardware',
  'Salon & Beauty',
  'Professional Services',
  'Health & Wellness',
  'Technology & Electronics',
  'Other',
];

const PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
];

export default function BusinessProfile() {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [isLoadingBusiness, setIsLoadingBusiness] = useState(true);
  const [business, setBusiness] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    category: 'Retail',
    description: '',
    phoneNumber: '',
    email: '',
    address: '',
    city: '',
    province: 'Gauteng',
  });

  const isBusinessAccount = (user?.accountType || '').toUpperCase() === 'BUSINESS';

  const loadMyBusiness = useCallback(async () => {
    if (!isBusinessAccount) {
      setIsLoadingBusiness(false);
      return;
    }

    setIsLoadingBusiness(true);
    setStatusMessage(null);

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
        'Unable to load business profile. Please try again.';
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setIsLoadingBusiness(false);
    }
  }, [isBusinessAccount]);

  useEffect(() => {
    if (user && !isAuthLoading) {
      loadMyBusiness();
    }
  }, [user, isAuthLoading, loadMyBusiness]);

  // Image management state
  const [images, setImages] = useState([]);
  const [isImagesLoading, setIsImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState(null);
  const [imageActionMessage, setImageActionMessage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCoverOption, setUploadCoverOption] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const [imageToDelete, setImageToDelete] = useState(null);
  const fileInputRef = useRef(null);

  const loadBusinessImages = useCallback(async (businessId) => {
    if (!businessId || typeof businessService.getBusinessImages !== 'function') {
      return;
    }

    setIsImagesLoading(true);
    setImagesError(null);

    try {
      const data = await businessService.getBusinessImages(businessId);
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err.data?.message ||
        err.message ||
        'Unable to load business photos.';
      setImagesError(message);
      setImages([]);
    } finally {
      setIsImagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (business?.id && !isEditing) {
      loadBusinessImages(business.id);
    }
  }, [business?.id, isEditing, loadBusinessImages]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (!file || !business?.id) return;

    setImageActionMessage(null);

    // 1. Quota check (max 10 photos)
    if (images.length >= 10) {
      setImageActionMessage({
        type: 'error',
        text: 'Maximum limit of 10 photos reached for this business. Delete an existing photo before uploading a new one.',
      });
      return;
    }

    // 2. File size check (max 5 MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setImageActionMessage({
        type: 'error',
        text: 'Image file size exceeds the 5MB limit. Please choose a smaller photo.',
      });
      return;
    }

    // 3. File type check (JPEG, PNG, WebP)
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validExtensions = /\.(jpe?g|png|webp)$/i;
    if (!validMimeTypes.includes(file.type.toLowerCase()) && !validExtensions.test(file.name)) {
      setImageActionMessage({
        type: 'error',
        text: 'Invalid image format. Only JPG, PNG, and WebP images are allowed.',
      });
      return;
    }

    if (typeof businessService.uploadBusinessImage !== 'function') {
      return;
    }

    setIsUploading(true);

    try {
      await businessService.uploadBusinessImage(business.id, file, uploadCoverOption);
      setImageActionMessage({
        type: 'success',
        text: 'Photo uploaded successfully!',
      });
      setUploadCoverOption(false);
      await loadBusinessImages(business.id);
    } catch (err) {
      const message =
        err.data?.message ||
        err.message ||
        'Failed to upload image. Please check your connection and try again.';
      setImageActionMessage({
        type: 'error',
        text: message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetCover = async (image) => {
    if (!business?.id || !image?.id) return;

    // Prevent unnecessary API calls when already cover
    if (image.isCover) return;

    if (actionInProgressId || typeof businessService.setCoverImage !== 'function') return;

    setActionInProgressId(image.id);
    setImageActionMessage(null);

    try {
      await businessService.setCoverImage(business.id, image.id);
      setImageActionMessage({
        type: 'success',
        text: 'Cover photo updated successfully!',
      });
      await loadBusinessImages(business.id);
    } catch (err) {
      const message =
        err.data?.message ||
        err.message ||
        'Failed to set cover photo. Please try again.';
      setImageActionMessage({
        type: 'error',
        text: message,
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleInitiateDelete = (image) => {
    setImageActionMessage(null);
    setImageToDelete(image);
  };

  const handleCancelDelete = () => {
    setImageToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!business?.id || !imageToDelete?.id) return;

    if (typeof businessService.deleteBusinessImage !== 'function') return;

    const targetId = imageToDelete.id;
    setActionInProgressId(targetId);
    setImageActionMessage(null);

    try {
      await businessService.deleteBusinessImage(business.id, targetId);
      setImageActionMessage({
        type: 'success',
        text: 'Photo deleted successfully!',
      });
      setImageToDelete(null);
      await loadBusinessImages(business.id);
    } catch (err) {
      const message =
        err.data?.message ||
        err.message ||
        'Failed to delete photo. Please try again.';
      setImageActionMessage({
        type: 'error',
        text: message,
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleStartEdit = () => {
    if (!business) return;
    setFormData({
      name: business.name || '',
      category: business.category || 'Retail',
      description: business.description || '',
      phoneNumber: business.phoneNumber || '',
      email: business.email || '',
      address: business.address || '',
      city: business.city || '',
      province: business.province || 'Gauteng',
    });
    setErrors({});
    setStatusMessage(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrors({});
    setStatusMessage(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const nameTrimmed = formData.name.trim();
    if (!nameTrimmed) {
      newErrors.name = 'Business name is required';
    } else if (nameTrimmed.length > 255) {
      newErrors.name = 'Business name must not exceed 255 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    const descTrimmed = formData.description.trim();
    if (!descTrimmed) {
      newErrors.description = 'Business description is required';
    } else if (descTrimmed.length > 255) {
      newErrors.description = 'Description must not exceed 255 characters';
    }

    const phoneTrimmed = formData.phoneNumber.trim();
    if (!phoneTrimmed) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) {
      newErrors.email = 'Business email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      newErrors.email = 'Please provide a valid email address';
    }

    const addressTrimmed = formData.address.trim();
    if (!addressTrimmed) {
      newErrors.address = 'Street address is required';
    } else if (addressTrimmed.length > 255) {
      newErrors.address = 'Address must not exceed 255 characters';
    }

    const cityTrimmed = formData.city.trim();
    if (!cityTrimmed) {
      newErrors.city = 'Township or city is required';
    } else if (cityTrimmed.length > 255) {
      newErrors.city = 'City must not exceed 255 characters';
    }

    if (!formData.province) {
      newErrors.province = 'Province is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    // Format phone number to match E.164 if local
    let formattedPhone = formData.phoneNumber.replace(/[\s-]/g, '').trim();
    if (formattedPhone.startsWith('0') && formattedPhone.length === 10) {
      formattedPhone = '+27' + formattedPhone.substring(1);
    }

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      description: formData.description.trim(),
      phoneNumber: formattedPhone,
      email: formData.email.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      province: formData.province,
    };

    try {
      if (isEditing && business?.id) {
        const updated = await businessService.updateBusiness(business.id, payload);
        setBusiness(updated);
        setIsEditing(false);
        setStatusMessage({
          type: 'success',
          text: 'Business profile updated successfully!',
        });
      } else {
        const created = await businessService.createBusiness(payload);
        setBusiness(created);
        setStatusMessage({
          type: 'success',
          text: 'Business profile created successfully!',
        });
      }
    } catch (err) {
      let message = isEditing
        ? 'Failed to update business profile. Please check your details.'
        : 'Failed to create business listing. Please check your details.';

      if (err.status === 409 || err.data?.status === 409) {
        message = 'A business listing already exists for this account.';
        loadMyBusiness();
      } else if (err.status === 403 || err.data?.status === 403) {
        message = isEditing
          ? 'You do not have permission to update this business.'
          : 'Only BUSINESS accounts have permission to create listings.';
      } else if (err.data?.message) {
        message = err.data.message;
      } else if (err.message) {
        message = err.message;
      }
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isLoadingBusiness) {
    return (
      <div className="page-wrapper flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Guard for non-BUSINESS accounts
  if (!isBusinessAccount) {
    return (
      <div className="page-wrapper pb-24">
        <Header
          title="Business Profile"
          subtitle="Enterprise management"
          showBack={true}
          onBack={() => navigate('/profile')}
        />
        <div className="page-content page-padding py-8 max-w-md mx-auto w-full">
          <Card className="p-6 text-center space-y-4 shadow-sm border-neutral-200">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">
              Business Account Required
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Business Profile creation and management is exclusively available for accounts registered with the <strong className="text-neutral-800">Business</strong> account type.
            </p>
            <p className="text-xs text-neutral-500">
              Your account is currently registered as <strong className="capitalize">{user?.accountType?.toLowerCase() || 'Resident'}</strong>. Residents and workers can browse public business listings in Explore.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="primary"
                onClick={() => navigate('/explore')}
                className="w-full"
              >
                Browse Businesses
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/profile')}
                className="w-full"
              >
                Back to Profile
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    if (isEditing) return 'Edit Business Profile';
    if (business) return 'Business Profile';
    return 'Create Business Profile';
  };

  const getPageSubtitle = () => {
    if (isEditing) return 'Update your business listing details';
    if (business) return 'Manage your registered business';
    return 'Set up your township business listing';
  };

  return (
    <div className="page-wrapper pb-24">
      <Header
        title={getPageTitle()}
        subtitle={getPageSubtitle()}
        showBack={true}
        onBack={() => {
          if (isEditing) {
            handleCancelEdit();
          } else {
            navigate('/profile');
          }
        }}
      />

      <div className="page-content page-padding py-6 max-w-md mx-auto w-full space-y-6">
        {/* Alerts */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
            role="alert"
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{statusMessage.text}</div>
          </div>
        )}

        {/* Existing Business Profile View (when not editing) */}
        {business && !isEditing ? (
          <div className="space-y-6" data-testid="existing-business-view">
            {/* Business Header Card */}
            <Card className="p-6 shadow-sm border-neutral-200">
              <div className="flex items-start justify-between gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-2xl flex items-center justify-center shadow-md">
                  <Building2 className="w-7 h-7" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> Active Listing
                  </span>
                  <span className="text-[11px] text-neutral-400 mt-1">1 of 1 listing used</span>
                </div>
              </div>

              <div className="mt-4">
                <h2 className="text-xl font-bold text-neutral-900">{business.name}</h2>
                <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                  <Tag className="w-3 h-3" />
                  {business.category}
                </div>
                <p className="mt-3 text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                  {business.description}
                </p>
              </div>
            </Card>

            {/* Business Details Card */}
            <Card className="p-6 shadow-sm border-neutral-200 space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-100 pb-2">
                Contact & Location
              </h3>

              <div className="space-y-3.5 text-sm">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="block text-xs text-neutral-500 font-medium">Phone</span>
                    <span className="font-semibold text-neutral-900">{business.phoneNumber}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="block text-xs text-neutral-500 font-medium">Email</span>
                    <span className="font-semibold text-neutral-900">{business.email}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="block text-xs text-neutral-500 font-medium">Physical Address</span>
                    <span className="font-semibold text-neutral-900">
                      {business.address}, {business.city}, {business.province}
                    </span>
                  </div>
                </div>

                {business.createdAt && (
                  <div className="flex items-start gap-3 pt-2 border-t border-neutral-100">
                    <Calendar className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="block text-xs text-neutral-500 font-medium">Listed Since</span>
                      <span className="text-xs text-neutral-700">
                        {new Date(business.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Business Photos & Image Management Card */}
            <Card className="p-6 shadow-sm border-neutral-200 space-y-4" data-testid="business-images-card">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-kasi-green" />
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                      Photos & Gallery
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Showcase your storefront and products
                    </p>
                  </div>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700"
                  data-testid="image-quota-counter"
                >
                  {images.length}/10 photos
                </span>
              </div>

              {/* Action feedback message */}
              {imageActionMessage && (
                <div
                  className={`p-3 rounded-xl flex items-start gap-2.5 text-xs ${
                    imageActionMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                  role="status"
                  data-testid="image-action-status"
                >
                  {imageActionMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
                  )}
                  <span className="font-medium flex-1">{imageActionMessage.text}</span>
                  <button
                    type="button"
                    onClick={() => setImageActionMessage(null)}
                    className="text-neutral-400 hover:text-neutral-600 p-0.5 focus:outline-none"
                    aria-label="Dismiss message"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Upload Section */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-neutral-800">Add Business Photo</p>
                    <p className="text-[11px] text-neutral-500">
                      JPEG, PNG, or WebP up to 5 MB
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      id="photo-upload-input"
                      data-testid="photo-upload-input"
                      disabled={isUploading || images.length >= 10}
                    />
                    <label
                      htmlFor="photo-upload-input"
                      className={`btn-primary py-2 px-4 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 cursor-pointer text-center flex-1 sm:flex-initial transition-all ${
                        isUploading || images.length >= 10
                          ? 'opacity-50 cursor-not-allowed pointer-events-none'
                          : 'hover:bg-kasi-green-dark'
                      }`}
                      data-testid="upload-photo-btn"
                    >
                      {isUploading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>{images.length >= 10 ? 'Limit Reached (10/10)' : 'Upload Photo'}</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {images.length > 0 && images.length < 10 && (
                  <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer select-none pt-1 border-t border-neutral-200/60">
                    <input
                      type="checkbox"
                      checked={uploadCoverOption}
                      onChange={(e) => setUploadCoverOption(e.target.checked)}
                      disabled={isUploading}
                      className="rounded border-neutral-300 text-kasi-green focus:ring-kasi-green"
                      data-testid="upload-as-cover-checkbox"
                    />
                    <span>Set as cover photo when uploaded</span>
                  </label>
                )}
              </div>

              {/* Images Loading State */}
              {isImagesLoading && (
                <div
                  className="py-8 flex flex-col items-center justify-center gap-2 text-neutral-500"
                  data-testid="images-loading"
                >
                  <LoadingSpinner size="md" />
                  <p className="text-xs font-medium">Loading photos...</p>
                </div>
              )}

              {/* Images Error State */}
              {!isImagesLoading && imagesError && (
                <div
                  className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2"
                  data-testid="images-error"
                >
                  <div className="flex items-center justify-center gap-1.5 text-amber-700 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Failed to load business photos</span>
                  </div>
                  <p className="text-xs text-neutral-600 max-w-xs mx-auto">{imagesError}</p>
                  <button
                    type="button"
                    onClick={() => loadBusinessImages(business.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-kasi-green hover:underline focus:outline-none focus:ring-2 focus:ring-kasi-green rounded px-2 py-1"
                    data-testid="retry-images-btn"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry loading photos</span>
                  </button>
                </div>
              )}

              {/* Images Empty State */}
              {!isImagesLoading && !imagesError && images.length === 0 && (
                <div
                  className="p-6 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-300 space-y-2"
                  data-testid="images-empty"
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-200/60 text-neutral-400 mx-auto flex items-center justify-center">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-neutral-800">No photos uploaded yet</p>
                  <p className="text-[11px] text-neutral-500 max-w-xs mx-auto leading-relaxed">
                    Upload storefront, product, or team photos to make your business stand out in Explore and search results.
                  </p>
                </div>
              )}

              {/* Photos Grid */}
              {!isImagesLoading && !imagesError && images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="owner-image-grid">
                  {images.map((img, index) => {
                    const isCurrentAction = actionInProgressId === img.id;
                    const isCover = Boolean(img.isCover);
                    const altText = img.fileName || `${business.name} photo ${index + 1}`;

                    return (
                      <div
                        key={img.id || index}
                        className={`group relative rounded-xl overflow-hidden border bg-white flex flex-col shadow-xs transition-all ${
                          isCover ? 'border-kasi-green ring-2 ring-kasi-green/20' : 'border-neutral-200'
                        }`}
                        data-testid={`owner-image-card-${img.id || index}`}
                      >
                        {/* Thumbnail View */}
                        <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden">
                          <img
                            src={img.imageUrl}
                            alt={altText}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />

                          {/* Cover Badge */}
                          {isCover && (
                            <span
                              className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-kasi-green text-white shadow-xs flex items-center gap-1"
                              data-testid={`cover-badge-${img.id || index}`}
                            >
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span>Cover</span>
                            </span>
                          )}

                          {/* Delete Action Button */}
                          <button
                            type="button"
                            onClick={() => handleInitiateDelete(img)}
                            disabled={isCurrentAction || isUploading}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-red-600 text-white backdrop-blur-xs transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                            aria-label={`Delete ${altText}`}
                            data-testid={`delete-image-${img.id || index}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Controls & Filename */}
                        <div className="p-2 bg-white flex flex-col gap-1.5 border-t border-neutral-100">
                          <span
                            className="text-[11px] font-medium text-neutral-600 truncate"
                            title={img.fileName || `Photo ${index + 1}`}
                          >
                            {img.fileName || `Photo ${index + 1}`}
                          </span>

                          {isCover ? (
                            <span
                              className="text-[11px] font-bold text-kasi-green text-center py-1 bg-kasi-green-light rounded-md"
                              data-testid={`current-cover-indicator-${img.id || index}`}
                            >
                              Current Cover
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetCover(img)}
                              disabled={isCurrentAction || isUploading}
                              className="text-[11px] font-semibold text-neutral-700 hover:text-kasi-green hover:bg-neutral-50 border border-neutral-200 rounded-md py-1 px-2 transition-all flex items-center justify-center gap-1 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-kasi-green"
                              data-testid={`set-cover-${img.id || index}`}
                              aria-label={`Set ${altText} as cover`}
                            >
                              {isCurrentAction ? (
                                <>
                                  <LoadingSpinner size="sm" />
                                  <span>Updating...</span>
                                </>
                              ) : (
                                <>
                                  <Star className="w-3 h-3 text-neutral-400" />
                                  <span>Make Cover</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Customer Ratings & Reviews Summary Card */}
            <Card className="p-6 shadow-sm border-neutral-200 space-y-4" data-testid="business-reviews-summary-card">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                      Ratings & Reviews
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Customer ratings and community feedback
                    </p>
                  </div>
                </div>
                {business.reviewCount > 0 && (
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                    data-testid="business-profile-review-count-badge"
                  >
                    {business.reviewCount} {business.reviewCount === 1 ? 'review' : 'reviews'}
                  </span>
                )}
              </div>

              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                {business.averageRating != null && business.averageRating > 0 && business.reviewCount > 0 ? (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-2xl font-extrabold text-neutral-900"
                          data-testid="business-profile-average-rating"
                        >
                          {Number(business.averageRating).toFixed(1)}
                        </span>
                        <div
                          className="flex items-center gap-0.5"
                          role="img"
                          aria-label={`${Number(business.averageRating).toFixed(1)} out of 5 stars`}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.round(Number(business.averageRating))
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-neutral-300 fill-neutral-100'
                              }`}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                      </div>
                      <p
                        className="text-xs text-neutral-500 mt-1"
                        data-testid="business-profile-review-count"
                      >
                        Based on {business.reviewCount} customer {business.reviewCount === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center sm:text-left space-y-1" data-testid="business-profile-no-reviews">
                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <Star className="w-4 h-4 text-neutral-300" />
                      <span className="text-xs font-semibold text-neutral-700">No customer reviews yet</span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Your business listing has not received any customer reviews yet. Once customers review your listing, their feedback will appear on your dashboard.
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                onClick={() => navigate('/business-reviews')}
                className="w-full flex items-center justify-center gap-2 text-xs py-2.5"
                data-testid="view-review-dashboard-btn"
                aria-label="View Review Dashboard"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>View Review Dashboard</span>
              </Button>
            </Card>

            {/* Actions: Edit & View Public */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={handleStartEdit}
                className="flex-1 flex items-center justify-center gap-2"
                aria-label="Edit Business Profile"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Business Profile</span>
              </Button>

              <Button
                variant="secondary"
                onClick={() => navigate(`/businesses/${business.id}`)}
                className="flex-1 flex items-center justify-center gap-2 text-neutral-700"
                aria-label="View Public Page"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Public Page</span>
              </Button>
            </div>

            {/* Account Policy Info */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <span>
                Each Business account is limited to one business profile during this release.
              </span>
            </div>
          </div>
        ) : (
          /* Business Form (Creation or Edit Mode) */
          <Card
            className="p-6 shadow-sm border-neutral-200"
            data-testid={isEditing ? 'business-edit-form' : 'business-create-form'}
          >
            <div className="border-b border-neutral-100 pb-3 mb-5">
              <h2 className="text-lg font-bold text-neutral-900">
                {isEditing ? 'Edit Business Listing' : 'Register Your Business'}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {isEditing
                  ? 'Update your business information below and save your changes.'
                  : 'Fill in your business details to publish your listing to the KasiCircle community.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Business Name *"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="e.g. Soweto Fresh Cafe"
                maxLength={255}
                required
                disabled={isSubmitting}
              />

              {/* Category Dropdown */}
              <div>
                <label htmlFor="business-category" className="block text-sm font-semibold text-neutral-900 mb-2">
                  Category *
                </label>
                <select
                  id="business-category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`input-field bg-white ${errors.category ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="business-description" className="block text-sm font-semibold text-neutral-900 mb-2">
                  Business Description *
                </label>
                <textarea
                  id="business-description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell your community what services or products you provide..."
                  maxLength={255}
                  disabled={isSubmitting}
                  className={`input-field resize-none ${errors.description ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description ? (
                    <p className="text-red-500 text-xs">{errors.description}</p>
                  ) : (
                    <p className="text-neutral-500 text-xs">Maximum 255 characters</p>
                  )}
                  <span className="text-[11px] text-neutral-400">
                    {formData.description.length}/255
                  </span>
                </div>
              </div>

              <Input
                label="Phone Number *"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={errors.phoneNumber}
                placeholder="e.g. 0821234567 or +27821234567"
                required
                disabled={isSubmitting}
              />

              <Input
                label="Business Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="e.g. info@freshcafe.co.za"
                required
                disabled={isSubmitting}
              />

              <Input
                label="Physical Address / Street *"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                error={errors.address}
                placeholder="e.g. 123 Vilakazi Street"
                maxLength={255}
                required
                disabled={isSubmitting}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Township / City *"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  error={errors.city}
                  placeholder="e.g. Soweto"
                  maxLength={255}
                  required
                  disabled={isSubmitting}
                />

                <div>
                  <label htmlFor="business-province" className="block text-sm font-semibold text-neutral-900 mb-2">
                    Province *
                  </label>
                  <select
                    id="business-province"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`input-field bg-white ${errors.province ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                  >
                    {PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                  {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 flex flex-col gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>{isEditing ? 'Saving Changes...' : 'Creating Business Profile...'}</span>
                    </>
                  ) : (
                    <span>{isEditing ? 'Save Changes' : 'Create Business Profile'}</span>
                  )}
                </Button>

                {isEditing && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {imageToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm image deletion"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          data-testid="delete-confirmation-dialog"
        >
          <Card className="p-6 max-w-sm w-full space-y-4 shadow-xl border-neutral-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 text-sm">Delete Photo?</h4>
                <p className="text-xs text-neutral-500">
                  {imageToDelete.isCover
                    ? 'This is your cover photo. A remaining photo will be assigned as cover.'
                    : 'This action cannot be undone.'}
                </p>
              </div>
            </div>

            <div className="aspect-video w-full rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
              <img
                src={imageToDelete.imageUrl}
                alt={imageToDelete.fileName || 'Photo to delete'}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancelDelete}
                disabled={Boolean(actionInProgressId)}
                className="flex-1 text-xs py-2"
                data-testid="cancel-delete-btn"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={Boolean(actionInProgressId)}
                className="flex-1 text-xs py-2 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1.5"
                data-testid="confirm-delete-btn"
              >
                {actionInProgressId ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Photo</span>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

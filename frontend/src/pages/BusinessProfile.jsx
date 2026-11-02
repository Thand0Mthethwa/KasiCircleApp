import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Header, BottomNavigation, LoadingSpinner } from '../components';
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
      const created = await businessService.createBusiness(payload);
      setBusiness(created);
      setStatusMessage({
        type: 'success',
        text: 'Business profile created successfully!',
      });
    } catch (err) {
      let message = 'Failed to create business listing. Please check your details.';
      if (err.status === 409 || err.data?.status === 409) {
        message = 'A business listing already exists for this account.';
        // Refresh from backend to display the existing listing
        loadMyBusiness();
      } else if (err.status === 403 || err.data?.status === 403) {
        message = 'Only BUSINESS accounts have permission to create listings.';
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
        <BottomNavigation active="profile" onNavigate={(path) => navigate(path)} />
      </div>
    );
  }

  return (
    <div className="page-wrapper pb-24">
      <Header
        title={business ? 'Business Profile' : 'Create Business Profile'}
        subtitle={business ? 'Manage your registered business' : 'Set up your township business listing'}
        showBack={true}
        onBack={() => navigate('/profile')}
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

        {/* Existing Business Profile View */}
        {business ? (
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

            {/* Account Policy Info */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <span>
                Each Business account is limited to one business profile during this release.
              </span>
            </div>
          </div>
        ) : (
          /* Business Creation Form */
          <Card className="p-6 shadow-sm border-neutral-200" data-testid="business-create-form">
            <div className="border-b border-neutral-100 pb-3 mb-5">
              <h2 className="text-lg font-bold text-neutral-900">Register Your Business</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Fill in your business details to publish your listing to the KasiCircle community.
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
                  error={errors.description}
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

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Creating Business Profile...</span>
                    </>
                  ) : (
                    <span>Create Business Profile</span>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      <BottomNavigation active="profile" onNavigate={(path) => navigate(path)} />
    </div>
  );
}


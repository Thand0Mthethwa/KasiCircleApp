import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Header, BottomNavigation, LoadingSpinner } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/api';
import {
  Edit2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Lock,
  Building2,
} from 'lucide-react';

/**
 * Returns user-friendly presentation details for each account type.
 */
const getAccountTypeDetails = (type) => {
  const normalized = (type || 'RESIDENT').toUpperCase();
  switch (normalized) {
    case 'WORKER':
      return {
        label: 'Worker',
        emoji: '🔧',
        badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
        description: 'Providing skilled services in the community',
      };
    case 'BUSINESS':
      return {
        label: 'Business',
        emoji: '🏢',
        badgeClass: 'bg-blue-100 text-blue-800 border border-blue-200',
        description: 'Local enterprise & service provider',
      };
    case 'RESIDENT':
    default:
      return {
        label: 'Resident',
        emoji: '🏘️',
        badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        description: 'Local community member',
      };
  }
};

/**
 * Derives user initials for avatar display.
 */
const getInitials = (firstName, lastName) => {
  const first = (firstName || '').trim().charAt(0).toUpperCase();
  const last = (lastName || '').trim().charAt(0).toUpperCase();
  return `${first}${last}` || 'KC';
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logout, isLoading: isAuthLoading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Sync local form state when user changes and not actively editing
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user, isEditing]);

  const accountInfo = getAccountTypeDetails(user?.accountType);

  const handleStartEdit = () => {
    setStatusMessage(null);
    setErrors({});
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setStatusMessage(null);
    setErrors({});
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (isSaving) return;

    // Validation matching backend limits
    const newErrors = {};
    const firstNameTrimmed = formData.firstName.trim();
    const lastNameTrimmed = formData.lastName.trim();

    if (!firstNameTrimmed) {
      newErrors.firstName = 'First name cannot be blank';
    } else if (firstNameTrimmed.length > 50) {
      newErrors.firstName = 'First name must be less than or equal to 50 characters';
    }

    if (!lastNameTrimmed) {
      newErrors.lastName = 'Last name cannot be blank';
    } else if (lastNameTrimmed.length > 60) {
      newErrors.lastName = 'Last name must be less than or equal to 60 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const payload = {
        firstName: firstNameTrimmed,
        lastName: lastNameTrimmed,
        phoneNumber: user?.phoneNumber || null,
      };

      const updatedProfile = await userService.updateProfile(payload);

      // Only update local AuthContext & localStorage upon backend confirmation
      updateUser(updatedProfile);

      setStatusMessage({
        type: 'success',
        text: 'Profile updated successfully!',
      });
      setIsEditing(false);
    } catch (err) {
      const message =
        err.data?.message ||
        err.message ||
        'Failed to update profile. Please try again.';
      setStatusMessage({
        type: 'error',
        text: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/welcome');
  };

  if (isAuthLoading) {
    return (
      <div className="page-wrapper flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-wrapper page-padding py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">No profile information available.</p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper pb-24">
      {/* Top Header */}
      <Header
        title="My Profile"
        subtitle="Manage your personal information"
        showBack={true}
        onBack={() => navigate('/home')}
      />

      <div className="page-content page-padding py-6 max-w-md mx-auto w-full space-y-6">
        {/* Status Alerts */}
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

        {/* User Identity Banner */}
        <Card className="p-6 text-center shadow-sm">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-kasi-green to-kasi-green-dark text-white font-bold text-2xl flex items-center justify-center shadow-md mb-3">
            {getInitials(user.firstName, user.lastName)}
          </div>
          <h2 className="text-xl font-bold text-neutral-900">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-sm text-neutral-500 mb-3">{user.email}</p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-xs">
            <span className={`px-2.5 py-1 rounded-full ${accountInfo.badgeClass}`}>
              {accountInfo.emoji} {accountInfo.label}
            </span>
          </div>
          {user.role === 'ADMIN' && (
            <Button type="button" variant="secondary" className="mt-4 w-full" onClick={() => navigate('/admin/reports')}>
              Review content reports
            </Button>
          )}
        </Card>

        {/* View Mode */}
        {!isEditing ? (
          <Card className="p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900">Personal Information</h3>
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-kasi-green hover:text-kasi-green-dark transition-colors"
                aria-label="Edit personal information"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  First Name
                </span>
                <p className="text-base font-medium text-neutral-900">{user.firstName || '—'}</p>
              </div>

              <div>
                <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Last Name
                </span>
                <p className="text-base font-medium text-neutral-900">{user.lastName || '—'}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Email Address
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 font-medium">
                    <Lock className="w-3 h-3" /> Read-only
                  </span>
                </div>
                <p className="text-base font-medium text-neutral-900">{user.email}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Account Type
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 font-medium">
                    <Lock className="w-3 h-3" /> Read-only
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-neutral-900">
                    {accountInfo.label} {accountInfo.emoji}
                  </span>
                  <span className="text-xs text-neutral-500">({accountInfo.description})</span>
                </div>
              </div>

              {user.phoneNumber && (
                <div>
                  <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Phone Number
                  </span>
                  <p className="text-base font-medium text-neutral-900">{user.phoneNumber}</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={handleStartEdit}
                className="w-full flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </Button>
            </div>
          </Card>
        ) : (
          /* Edit Mode */
          <Card className="p-6 shadow-sm">
            <div className="border-b border-neutral-100 pb-3 mb-5">
              <h3 className="text-base font-bold text-neutral-900">Edit Personal Information</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Update your first and last names below.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="First Name"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                placeholder="Enter first name"
                maxLength={50}
                required
                disabled={isSaving}
              />

              <Input
                label="Last Name"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                placeholder="Enter last name"
                maxLength={60}
                required
                disabled={isSaving}
              />

              {/* Read-Only Fields */}
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    readOnly
                    className="input-field bg-neutral-100 text-neutral-500 cursor-not-allowed border-neutral-200"
                  />
                  <Lock className="absolute right-4 top-3.5 w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Email address cannot be changed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Account Type
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={`${accountInfo.label} ${accountInfo.emoji}`}
                    disabled
                    readOnly
                    className="input-field bg-neutral-100 text-neutral-500 cursor-not-allowed border-neutral-200"
                  />
                  <Lock className="absolute right-4 top-3.5 w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Account type is permanent and cannot be changed.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Business Management for BUSINESS accounts */}
        {user?.accountType === 'BUSINESS' && (
          <Card className="p-4 shadow-sm border-blue-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-900">Business Profile</h4>
                  <p className="text-xs text-neutral-500">Manage your business listing</p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/business-profile')}
                className="text-xs py-2 px-3.5"
              >
                Manage
              </Button>
            </div>
          </Card>
        )}

        {user?.accountType === 'WORKER' && (
          <Card className="p-4 shadow-sm border-amber-100 bg-gradient-to-r from-amber-50/50 to-orange-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs" aria-hidden="true">
                  🔧
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-900">Worker Profile</h4>
                  <p className="text-xs text-neutral-500">Manage your public skills and services</p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/worker-profile')}
                className="text-xs py-2 px-3.5"
              >
                Manage
              </Button>
            </div>
          </Card>
        )}

        {/* Account Actions */}
        <Card className="p-4 shadow-sm">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        active="profile"
        onNavigate={(path) => navigate(path)}
      />
    </div>
  );
}

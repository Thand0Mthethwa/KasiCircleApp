import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, LoadingSpinner, CategoryCard } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error: authError } = useAuth();
  
  const [accountType, setAccountType] = useState('Resident');
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!formData.phoneNumber.match(/^[\d\s\-\+]{10,}$/)) {
      newErrors.phoneNumber = 'Enter a valid phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await register({
      ...formData,
      accountType,
    });

    if (result.success) {
      navigate('/home');
    }
  };

  const accountTypes = [
    {
      id: 'Resident',
      label: 'Resident',
      icon: '🏘️',
      description: 'Find services & jobs',
    },
    {
      id: 'Worker',
      label: 'Worker',
      icon: '🔧',
      description: 'Offer your skills',
    },
    {
      id: 'Business',
      label: 'Business',
      icon: '🏢',
      description: 'List your business',
    },
  ];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 page-padding py-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/welcome')}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6 text-neutral-900" />
          </button>
          <h1 className="text-2xl font-bold text-neutral-900">Create Account</h1>
        </div>
      </div>

      {/* Form Content */}
      <div className="page-content page-padding py-8 pb-20">
        {/* Heading */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 mb-1">
            Join KasiConnect 🎉
          </h2>
          <p className="text-neutral-600 text-sm">
            Create your free account today
          </p>
        </div>

        {/* Error Message */}
        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {authError}
          </div>
        )}

        {/* Account Type Selector */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-neutral-900 mb-3">I am a...</p>
          <div className="grid grid-cols-3 gap-3">
            {accountTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setAccountType(type.id)}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  accountType === type.id
                    ? 'border-kasi-green bg-kasi-green-light'
                    : 'border-neutral-200 bg-white hover:border-kasi-green'
                }`}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <p className="text-xs font-semibold text-neutral-900">{type.label}</p>
                <p className="text-xs text-neutral-600 mt-1">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <Input
            label="Full Name"
            name="fullName"
            type="text"
            placeholder="e.g. Sipho Dlamini"
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
          />

          <Input
            label="Phone Number"
            name="phoneNumber"
            type="tel"
            placeholder="e.g. 078 123 4567"
            value={formData.phoneNumber}
            onChange={handleChange}
            error={errors.phoneNumber}
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="e.g. sipho@email.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />

          <div className="relative">
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 characters"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              hint="Min 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-10 text-neutral-500 hover:text-neutral-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          {/* Terms Checkbox */}
          <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (errors.terms) {
                  setErrors((prev) => ({
                    ...prev,
                    terms: '',
                  }));
                }
              }}
              className="w-5 h-5 text-kasi-green rounded cursor-pointer mt-0.5"
            />
            <label htmlFor="terms" className="text-xs text-neutral-600 cursor-pointer">
              By registering, you agree to our{' '}
              <span className="text-kasi-green font-semibold">Terms of Service</span> and{' '}
              <span className="text-kasi-green font-semibold">Privacy Policy.</span>
            </label>
          </div>
          {errors.terms && (
            <p className="text-red-500 text-xs">{errors.terms}</p>
          )}

          {/* Register Button */}
          <Button
            variant="primary"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-neutral-600 text-sm">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="link-text"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

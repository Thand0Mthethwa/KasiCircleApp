import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Header, LoadingSpinner } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error: authError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email or phone number is required';
    } else if (
      !formData.email.includes('@') &&
      !formData.email.match(/^[\d\s\-\+]{10,}$/)
    ) {
      newErrors.email = 'Enter a valid email or phone number';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
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
    // Clear error for this field
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

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/home');
    }
  };

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
          <h1 className="text-2xl font-bold text-neutral-900">Login</h1>
        </div>
      </div>

      {/* Form Content */}
      <div className="page-content page-padding py-8">
        {/* Heading */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-neutral-600 text-sm">
            Sign in to your KasiConnect account
          </p>
        </div>

        {/* Error Message */}
        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {authError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <Input
            label="Email or Phone Number"
            name="email"
            type="text"
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
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
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

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              className="text-kasi-green text-sm font-semibold hover:opacity-75 transition-opacity"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <Button
            variant="primary"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-neutral-500">or continue with</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Button variant="secondary">
            <span>📱 Phone</span>
          </Button>
          <Button variant="secondary">
            <span>🔍 Google</span>
          </Button>
        </div>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-neutral-600 text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="link-text"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

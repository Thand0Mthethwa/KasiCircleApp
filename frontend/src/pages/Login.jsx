import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, LoadingSpinner } from "../components";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import AuthLayout from "../components/AuthLayout";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error: authError } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!formData.email.includes("@")) {
      // Backend only supports email for now, per LoginRequest.java
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
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
        [name]: "",
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
      navigate("/home");
    }
  };

  return (
    <AuthLayout
      eyebrow="Back to your community"
      title="Welcome back."
      description="Log in to your KasiCircle account and pick up where you left off."
    >
      {authError && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 text-sm"
        >
          {authError}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          label="Email address"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />
        <div className="relative">
          <Input
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="current-password"
            className="pr-14"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-1 top-8 icon-button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Logging in...
            </>
          ) : (
            <>
              Login
              <ArrowRight size={17} aria-hidden="true" />
            </>
          )}
        </Button>
      </form>
      <p className="text-sm text-neutral-600 text-center mt-7">
        New to the neighbourhood?{" "}
        <button
          type="button"
          onClick={() => navigate("/register")}
          className="link-text px-1"
        >
          Create an account
        </button>
      </p>
      <button
        type="button"
        className="link-text text-sm mt-4 w-full text-center py-2"
        onClick={() => navigate("/home")}
      >
        Keep exploring as a guest
      </button>
    </AuthLayout>
  );
}

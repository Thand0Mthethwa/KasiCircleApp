import { createElement, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, LoadingSpinner } from "../components";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, Home, Store, Wrench } from "lucide-react";
import AuthLayout from "../components/AuthLayout";

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error: authError } = useAuth();

  const [accountType, setAccountType] = useState("Resident");
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().split(/\s+/).length < 2) {
      newErrors.fullName = "Please enter both your first and last name";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!formData.phoneNumber.match(/^[\d\s-+]{10,}$/)) {
      newErrors.phoneNumber = "Enter a valid phone number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!formData.email.includes("@")) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!agreedToTerms) {
      newErrors.terms =
        "You must agree to the Terms of Service and Privacy Policy";
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
        [name]: "",
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
      navigate("/home");
    }
  };

  const accountTypes = [
    {
      id: "Resident",
      label: "Resident",
      icon: Home,
      description: "Find services & jobs",
    },
    {
      id: "Worker",
      label: "Worker",
      icon: Wrench,
      description: "Offer your skills",
    },
    {
      id: "Business",
      label: "Business",
      icon: Store,
      description: "List your business",
    },
  ];
  return (
    <AuthLayout
      eyebrow="Join KasiCircle"
      title="Create Account"
      description="Make your next connection close to home. Create your free community account."
    >
      {authError && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 text-sm"
        >
          {authError}
        </div>
      )}
      <fieldset className="mb-6">
        <legend className="text-sm font-semibold mb-3">I am a...</legend>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {accountTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setAccountType(type.id)}
              className="account-type-option"
              aria-pressed={accountType === type.id}
            >
              {createElement(type.icon, {
                size: 23,
                "aria-hidden": true,
                className: "mb-3",
              })}
              <span className="font-semibold text-sm">{type.label}</span>
              <span className="text-[11px] text-neutral-600 mt-1 leading-relaxed">
                {type.description}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      <form onSubmit={handleSubmit} className="space-y-5 mb-6" noValidate>
        <Input
          label="Full Name"
          name="fullName"
          type="text"
          placeholder="Your first and last name"
          value={formData.fullName}
          onChange={handleChange}
          error={errors.fullName}
          autoComplete="name"
        />
        <Input
          label="Phone Number"
          name="phoneNumber"
          type="tel"
          placeholder="e.g. +27 78 123 4567"
          value={formData.phoneNumber}
          onChange={handleChange}
          error={errors.phoneNumber}
          autoComplete="tel"
        />
        <Input
          label="Email Address"
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
            placeholder="Choose a strong password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            hint="Min 8 characters"
            autoComplete="new-password"
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
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          placeholder="Re-enter your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        <div className="flex items-start gap-3 min-h-11">
          <input
            type="checkbox"
            id="terms"
            className="w-5 h-5 shrink-0 mt-0.5"
            checked={agreedToTerms}
            aria-invalid={errors.terms ? "true" : undefined}
            aria-describedby={errors.terms ? "terms-error" : undefined}
            onChange={(event) => {
              setAgreedToTerms(event.target.checked);
              if (errors.terms)
                setErrors((previous) => ({ ...previous, terms: "" }));
            }}
          />
          <label
            htmlFor="terms"
            className="text-xs leading-relaxed text-neutral-600"
          >
            By registering, you agree to our{" "}
            <span className="font-semibold">Terms of Service</span> and{" "}
            <span className="font-semibold">Privacy Policy.</span>
          </label>
        </div>
        {errors.terms && (
          <p role="alert" id="terms-error" className="text-red-700 text-xs">
            {errors.terms}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
      <p className="text-sm text-neutral-600 text-center">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="link-text px-1"
        >
          Login
        </button>
      </p>
    </AuthLayout>
  );
}

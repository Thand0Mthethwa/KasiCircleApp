import React from 'react';
import { ChevronLeft, Search, Home, Briefcase, Compass, MessageCircle, User, Bell } from 'lucide-react';

// Button Components
export const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'font-semibold transition-all rounded-full focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    tertiary: 'btn-tertiary',
    icon: 'p-2 hover:bg-neutral-100 rounded-full transition-colors',
  };

  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg w-full',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${size !== 'icon' ? sizeClasses[size] : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Input Component
export const Input = ({
  label,
  error,
  hint,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-neutral-900 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-3.5 w-5 h-5 text-neutral-400 pointer-events-none" />}
        <input
          className={`input-field ${Icon ? 'pl-12' : 'pl-4'} ${error ? 'ring-2 ring-red-500 border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {hint && !error && <p className="text-neutral-500 text-xs mt-1">{hint}</p>}
    </div>
  );
};

// Header Component
export const Header = ({ title, subtitle, showBack = true, onBack }) => {
  return (
    <div className="page-header page-padding py-6">
      <div className="flex items-center gap-3 mb-4">
        {showBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {title && <h1 className="text-2xl font-bold">{title}</h1>}
      </div>
      {subtitle && <p className="text-white/80 text-sm">{subtitle}</p>}
    </div>
  );
};

// Card Component
export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white rounded-lg border border-neutral-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Stat Card Component
export const StatCard = ({ icon: Icon, value, label, bgColor = 'bg-kasi-green-light' }) => {
  return (
    <div className={`${bgColor} rounded-xl p-4 flex flex-col items-center justify-center`}>
      {Icon && <Icon className="w-8 h-8 text-neutral-900 mb-2" />}
      <p className="text-xl font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-600 text-center mt-1">{label}</p>
    </div>
  );
};

// Category Card Component
export const CategoryCard = ({ icon: Icon, label, onClick, isSelected = false }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
        isSelected
          ? 'ring-2 ring-kasi-green bg-kasi-green-light'
          : 'bg-neutral-100 hover:bg-neutral-200'
      }`}
      aria-label={label}
    >
      {Icon && <Icon className="w-8 h-8 text-neutral-900" />}
      <span className="text-xs font-semibold text-neutral-900 text-center">{label}</span>
    </button>
  );
};

// Worker Card Component
export const WorkerCard = ({ image, name, profession, isVerified = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-col items-center gap-3 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="relative">
        <div className="w-20 h-20 bg-gradient-to-br from-kasi-green to-kasi-green-dark rounded-full flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
        {isVerified && (
          <div className="absolute bottom-0 right-0 bg-kasi-green text-white rounded-full p-1 border-2 border-white">
            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
              <path d="M7 10l2 2 4-4" />
            </svg>
          </div>
        )}
      </div>
      <p className="font-semibold text-neutral-900 text-center">{name}</p>
      <p className="text-xs text-neutral-600 text-center">{profession}</p>
    </div>
  );
};

// Bottom Navigation Component
export const BottomNavigation = ({ active = 'home', onNavigate }) => {
  const items = [
    { id: 'home', label: 'Home', icon: Home, path: '/home' },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, path: '/jobs' },
    { id: 'explore', label: 'Explore', icon: Compass, path: '/explore' },
    { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/messages' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 flex justify-around max-w-md mx-auto">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.path)}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
              isActive
                ? 'text-kasi-green'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
            aria-label={item.label}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-semibold">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// Search Bar Component
export const SearchBar = ({ placeholder = 'Search...', onSearch, onFocus }) => {
  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          onChange={(e) => onSearch?.(e.target.value)}
          onFocus={onFocus}
          className="input-field pl-12 bg-neutral-100"
        />
      </div>
      <button className="bg-kasi-green text-white p-3 rounded-full hover:bg-kasi-green-dark transition-colors">
        <Search className="w-5 h-5" />
      </button>
    </div>
  );
};

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`inline-flex ${sizeClasses[size]} ${className}`}>
      <div className="animate-spin rounded-full border-4 border-neutral-300 border-t-kasi-green"></div>
    </div>
  );
};

// Progress Indicator Component
export const ProgressIndicator = ({ current = 1, total = 3 }) => {
  return (
    <div className="flex gap-2 justify-center my-4">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all ${
            i < current ? 'w-6 bg-kasi-green' : 'w-2 bg-neutral-300'
          }`}
          aria-label={`Step ${i + 1} of ${total}`}
        ></div>
      ))}
    </div>
  );
};

export default {
  Button,
  Input,
  Header,
  Card,
  StatCard,
  CategoryCard,
  WorkerCard,
  BottomNavigation,
  SearchBar,
  LoadingSpinner,
  ProgressIndicator,
};

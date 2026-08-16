import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, StatCard, CategoryCard, WorkerCard, BottomNavigation, SearchBar, LoadingSpinner } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { Bell, MapPin, Zap, Wrench, Hammer, Scissors, Construction, Lightbulb } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [activeNav, setActiveNav] = useState('home');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in production would come from API
  const mockStats = [
    { value: '1,240+', label: 'Workers', icon: Lightbulb, bgColor: 'bg-green-100' },
    { value: '87', label: 'Active Jobs', icon: Hammer, bgColor: 'bg-orange-100' },
    { value: '340+', label: 'Businesses', icon: Construction, bgColor: 'bg-blue-100' },
  ];

  const mockCategories = [
    { id: 1, icon: Zap, label: 'Electricians' },
    { id: 2, icon: Wrench, label: 'Plumbers' },
    { id: 3, icon: Hammer, label: 'Mechanics' },
    { id: 4, icon: Construction, label: 'Carpenters' },
    { id: 5, icon: Scissors, label: 'Stylists' },
  ];

  const mockWorkers = [
    {
      id: 1,
      name: 'Sipho Dlamini',
      profession: 'Electrician',
      isVerified: true,
      image: null,
    },
    {
      id: 2,
      name: 'Nomsa Khumalo',
      profession: 'Hairdresser',
      isVerified: true,
      image: null,
    },
  ];

  const handleSearch = (query) => {
    console.log('Search:', query);
    navigate('/search?q=' + encodeURIComponent(query));
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Use mock name if not authenticated
  const displayName = user?.firstName || 'Guest';

  return (
    <div className="page-wrapper pb-24">
      {/* Green Header Section */}
      <div className="bg-kasi-green text-white page-padding py-6">
        {/* Header Top */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm opacity-90 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Soweto, Gauteng
            </p>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>

        {/* Greeting */}
        <h1 className="text-2xl font-bold mb-1">
          {getGreeting()},<br />
          {displayName}! 👋
        </h1>
      </div>

      {/* Main Content */}
      <div className="page-content page-padding py-6 space-y-6">
        {/* Search Bar */}
        <SearchBar
          placeholder="Search workers, jobs, businesses..."
          onSearch={handleSearch}
        />

        {/* Statistics Cards */}
        <div>
          <div className="grid grid-cols-3 gap-3">
            {mockStats.map((stat, i) => (
              <StatCard
                key={i}
                icon={stat.icon}
                value={stat.value}
                label={stat.label}
                bgColor={stat.bgColor}
              />
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-900">Categories</h2>
            <button className="text-kasi-green text-sm font-semibold hover:opacity-75 transition-opacity">
              All →
            </button>
          </div>

          {/* Horizontally scrollable categories */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {mockCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleNavigate(`/category/${category.id}`)}
                    className="flex flex-col items-center gap-2 p-3 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors flex-shrink-0"
                  >
                    <div className="w-10 h-10 flex items-center justify-center text-xl">
                      <Icon className="w-6 h-6 text-kasi-green" />
                    </div>
                    <span className="text-xs font-semibold text-neutral-900 whitespace-nowrap">
                      {category.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Nearby Workers Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-900">Nearby Workers</h2>
            <button
              onClick={() => handleNavigate('/workers')}
              className="text-kasi-green text-sm font-semibold hover:opacity-75 transition-opacity"
            >
              See all →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {mockWorkers.map((worker) => (
              <WorkerCard
                key={worker.id}
                image={worker.image}
                name={worker.name}
                profession={worker.profession}
                isVerified={worker.isVerified}
                onClick={() => handleNavigate(`/worker/${worker.id}`)}
              />
            ))}
          </div>
        </div>

        {/* Additional spacing for bottom nav */}
        <div className="h-4"></div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        active={activeNav}
        onNavigate={(path) => {
          setActiveNav(path.split('/')[1]);
          handleNavigate(path);
        }}
      />
    </div>
  );
}

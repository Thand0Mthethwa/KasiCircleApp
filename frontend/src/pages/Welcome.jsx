import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components';
import { Zap, Wrench, Users, Home, Scissors, Construction } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  const categories = [
    { icon: Zap, label: 'Electricians' },
    { icon: Wrench, label: 'Plumbers' },
    { icon: Users, label: 'Carers' },
    { icon: Home, label: 'Builders' },
    { icon: Scissors, label: 'Stylists' },
    { icon: Construction, label: 'Carpenters' },
  ];

  return (
    <div className="page-wrapper">
      {/* Green Hero Section */}
      <div className="bg-kasi-green text-white py-16 page-padding text-center">
        {/* Logo */}
        <div className="inline-block bg-white/20 rounded-full p-4 mb-6">
          <div className="text-4xl font-bold">K</div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold mb-2">KasiConnect</h1>

        {/* Tagline */}
        <p className="text-white/90 text-sm mb-8">
          Connecting Communities. Creating Opportunities.
        </p>

        {/* Category Icons */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <div
                key={i}
                className="bg-white/20 rounded-full p-2 flex items-center justify-center"
              >
                <Icon className="w-6 h-6" />
              </div>
            );
          })}
        </div>
      </div>

      {/* White Content Section */}
      <div className="page-content page-padding flex flex-col justify-between py-8 pb-20">
        {/* Heading */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-neutral-600 text-sm">
            Your community marketplace for trusted services, local jobs and opportunities.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            onClick={() => navigate('/login')}
          >
            Login to Account
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate('/register')}
          >
            Create Account
          </Button>

          <button
            onClick={() => navigate('/home')}
            className="w-full text-kasi-green font-semibold py-3 hover:opacity-75 transition-opacity"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

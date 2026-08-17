import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ProgressIndicator } from '../components';
import { Search } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep] = useState(2); // Step 2 of 3

  const handleContinue = () => {
    navigate('/welcome');
  };

  return (
    <div className="page-wrapper">
      <div className="page-content page-padding flex flex-col justify-between pb-20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-kasi-green text-white rounded-lg p-2 mb-3">
            <span className="text-xl font-bold">K</span>
          </div>
          <p className="text-xs text-neutral-500 font-semibold">KasiConnect</p>
        </div>

        {/* Hero Image */}
        <div className="flex-1 flex items-center justify-center -mx-4 mb-8">
          <div className="relative w-full aspect-square max-h-96">
            {/* Placeholder for image - in production would use actual image */}
            <div className="w-full h-full bg-gradient-to-br from-kasi-green-light to-blue-100 rounded-3xl flex items-center justify-center overflow-hidden">
              <img
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%232D9D78' width='400' height='400'/%3E%3Ctext x='50%' y='50%' font-size='48' fill='white' text-anchor='middle' dy='.3em' font-family='sans-serif' font-weight='bold'%3EWorkers%3C/text%3E%3C/svg%3E"
                alt="Find Trusted Workers"
                className="w-full h-full object-cover"
              />
              {/* Search icon overlay */}
              <div className="absolute top-4 left-4 bg-white rounded-full p-3 shadow-lg">
                <Search className="w-6 h-6 text-kasi-green" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-3">
            Find Trusted Workers
          </h1>
          <p className="text-neutral-600 text-sm leading-relaxed">
            Connect with verified electricians, plumbers, carpenters and more — right in your township.
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator current={currentStep} total={3} />

        {/* Continue Button */}
        <Button variant="primary" onClick={handleContinue}>
          Continue →
        </Button>
      </div>
    </div>
  );
}

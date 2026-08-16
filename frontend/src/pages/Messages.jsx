import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components';
import { LoadingSpinner } from '../components';

export default function Messages() {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper page-padding py-8">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4">
            <LoadingSpinner size="lg" className="mx-auto opacity-30" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Messages</h1>
          <p className="text-neutral-600 mb-8">Coming soon...</p>
          <Button variant="secondary" onClick={() => navigate('/home')}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

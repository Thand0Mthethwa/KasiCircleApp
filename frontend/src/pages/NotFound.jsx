import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper flex items-center justify-center page-padding">
      <div className="text-center">
        <div className="text-6xl font-bold text-kasi-green mb-4">404</div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Page not found</h1>
        <p className="text-neutral-600 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Go Home
        </Button>
      </div>
    </div>
  );
}

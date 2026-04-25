import React from 'react';
import { Link } from 'react-router-dom';
import { Frown, ArrowLeft } from 'lucide-react';

const NotFound404 = () => {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 font-sans">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <Frown className="h-24 w-24 text-outline" />
        </div>
        <h1 className="text-8xl font-black text-on-surface mb-4 tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold text-on-surface mb-3">Page Not Found</h2>
        <p className="text-on-surface-variant mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Homepage
        </Link>
      </div>
    </div>
  );
};

export default NotFound404;

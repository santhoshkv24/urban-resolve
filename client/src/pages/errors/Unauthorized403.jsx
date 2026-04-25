import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized403 = () => {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white border border-outline/20 shadow-sm rounded-2xl p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-on-surface mb-2">Access Denied</h1>
          <p className="text-on-surface-variant">
            You don't have permission to view this page. This area is restricted based on your role.
          </p>
        </div>

        <div className="pt-4 border-t border-outline/10">
          <Link 
            to="/" 
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized403;

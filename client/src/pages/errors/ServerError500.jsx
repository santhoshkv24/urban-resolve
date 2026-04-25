import React from 'react';
import { ServerCrash, RefreshCw } from 'lucide-react';

const ServerError500 = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white border border-outline/20 shadow-sm rounded-2xl p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
          <ServerCrash className="h-8 w-8" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-on-surface mb-2">500: Server Error</h1>
          <p className="text-on-surface-variant">
            Oops, something went wrong on our end. We're working on fixing it. Please try again later.
          </p>
        </div>

        <div className="pt-4 border-t border-outline/10">
          <button 
            onClick={handleReload}
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border border-outline/30 text-on-surface rounded-lg font-medium hover:bg-surface transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerError500;

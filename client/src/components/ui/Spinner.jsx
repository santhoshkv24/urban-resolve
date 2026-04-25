import React from 'react';

/**
 * Spinner — Consistent loading spinner used throughout the app.
 * sizes: 'sm' | 'md' | 'lg' | 'xl'
 * variants: 'primary' | 'secondary' | 'white'
 */
const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[3px]',
  xl: 'w-16 h-16 border-4',
};

const colorMap = {
  primary:   'border-primary border-t-transparent',
  secondary: 'border-secondary border-t-transparent',
  white:     'border-white border-t-transparent',
  muted:     'border-on-surface-variant/30 border-t-on-surface-variant',
};

const Spinner = ({ size = 'md', variant = 'primary', className = '' }) => (
  <div
    className={[
      'rounded-full animate-spin',
      sizeMap[size] ?? sizeMap.md,
      colorMap[variant] ?? colorMap.primary,
      className,
    ].join(' ')}
    role="status"
    aria-label="Loading"
  />
);

/**
 * PageLoader — Full-height centered loading state for pages.
 */
export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <div className="relative">
      <Spinner size="lg" variant="secondary" />
      <div className="absolute inset-0 rounded-full animate-ping-slow border-2 border-secondary/20" />
    </div>
    {message && <p className="text-sm text-on-surface-variant animate-pulse">{message}</p>}
  </div>
);

export default Spinner;

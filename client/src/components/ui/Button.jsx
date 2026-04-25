import React from 'react';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary:   'bg-primary hover:bg-primary-hover text-white shadow-ambient-sm hover:shadow-glow active:scale-95',
  secondary: 'bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 active:scale-95',
  danger:    'bg-error hover:bg-red-700 text-white shadow-ambient-sm active:scale-95',
  tertiary:  'hover:bg-surface-container text-on-surface-variant hover:text-on-surface active:scale-95',
  civic:     'btn-civic',
  ghost:     'text-primary hover:bg-primary/8 border border-primary/30 hover:border-primary/60 active:scale-95',
  outline:   'bg-transparent border border-outline-variant hover:bg-surface-container text-on-surface active:scale-95',
};

const sizeClasses = {
  xs: 'px-2.5 py-1 text-xs',
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-3.5 text-base',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  leftIcon,
  rightIcon,
  onClick,
  ...props
}) => {
  const isDisabled = disabled || loading;
  const LeftIcon = leftIcon;
  const RightIcon = rightIcon;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        'relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl',
        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1',
        'overflow-hidden',
        variantClasses[variant] ?? variantClasses.primary,
        sizeClasses[size] ?? sizeClasses.md,
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {/* Shimmer overlay for non-civic variants */}
      {!isDisabled && variant !== 'civic' && (
        <span className="absolute inset-0 -translate-x-full hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      )}
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        LeftIcon && <LeftIcon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
      {RightIcon && !loading && <RightIcon className="w-4 h-4 shrink-0" />}
    </button>
  );
};

export default Button;

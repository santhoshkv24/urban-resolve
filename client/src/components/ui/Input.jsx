import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({
  label,
  id,
  error,
  hint,
  leftIcon,
  rightIcon,
  type = 'text',
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const LeftIcon = leftIcon;
  const RightIcon = rightIcon;

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-on-surface-variant"
        >
          {label}
          {props.required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center group">
        {LeftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-secondary transition-colors pointer-events-none">
            <LeftIcon className="w-4 h-4" />
          </span>
        )}

        <input
          id={inputId}
          type={resolvedType}
          className={[
            'w-full rounded-xl bg-surface text-on-surface text-sm',
            'placeholder:text-on-surface-variant/40 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            LeftIcon ? 'pl-10' : 'pl-4',
            isPassword || RightIcon ? 'pr-11' : 'pr-4',
            'py-2.5',
            'border',
            error
              ? 'border-error/60 focus:border-error focus:ring-error/20 bg-error-container/30'
              : 'border-outline-variant/60 focus:border-secondary focus:ring-secondary/15 hover:border-outline',
            className,
          ].join(' ')}
          {...props}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            tabIndex={-1}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        {/* Custom right icon (non-password) */}
        {RightIcon && !isPassword && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none">
            <RightIcon className="w-4 h-4" />
          </span>
        )}
      </div>

      {error && <p className="text-xs text-error font-medium flex items-center gap-1">{error}</p>}
      {hint && !error && <p className="text-xs text-on-surface-variant">{hint}</p>}
    </div>
  );
};

export default Input;

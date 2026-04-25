import React, { useEffect, useCallback } from 'react';
import { X, AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from './Button';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-screen-lg mx-4',
};

const VARIANTS = {
  default: { icon: null,           headerBg: 'bg-surface-container-low' },
  danger:  { icon: AlertTriangle,  headerBg: 'bg-red-50',     iconClass: 'text-error'          },
  success: { icon: CheckCircle2,   headerBg: 'bg-emerald-50', iconClass: 'text-emerald-600'    },
  info:    { icon: Info,           headerBg: 'bg-sky-50',     iconClass: 'text-secondary'      },
  warning: { icon: AlertCircle,    headerBg: 'bg-amber-50',   iconClass: 'text-amber-600'      },
};

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  variant = 'default',
  className = '',
  closeOnBackdrop = true,
  showClose = true,
  loading = false,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  confirmVariant = 'primary',
}) => {
  const variantConfig = VARIANTS[variant] ?? VARIANTS.default;
  const VariantIcon = variantConfig.icon;

  // Close on Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && !loading) onClose?.();
  }, [loading, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeOnBackdrop && !loading ? onClose : undefined}
      />

      {/* Panel */}
      <div
        className={[
          'relative w-full bg-white rounded-3xl shadow-ambient-lg overflow-hidden',
          'flex flex-col max-h-[90vh] border border-outline-variant/20',
          'animate-scale-in',
          SIZES[size] ?? SIZES.md,
          className,
        ].join(' ')}
      >
        {/* Header */}
        <div className={`flex items-start gap-4 px-6 py-5 border-b border-outline-variant/20 ${variantConfig.headerBg}`}>
          {VariantIcon && (
            <div className={`mt-0.5 shrink-0 ${variantConfig.iconClass}`}>
              <VariantIcon className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 id="modal-title" className="font-display font-bold text-on-surface text-base leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-on-surface-variant mt-1">{subtitle}</p>
            )}
          </div>
          {showClose && (
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-50 shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-on-surface">
          {children}
        </div>

        {/* Footer — custom or confirm/cancel pattern */}
        {(footer || confirmLabel) && (
          <div className="border-t border-outline-variant/20 px-6 py-4 bg-surface-container-low/30 flex items-center justify-end gap-3">
            {footer || (
              <>
                <Button variant="secondary" size="md" onClick={onClose} disabled={loading}>
                  {cancelLabel}
                </Button>
                <Button variant={confirmVariant} size="md" onClick={onConfirm} loading={loading}>
                  {confirmLabel}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;

import React from 'react';

/**
 * Card — Premium card with multiple variants.
 * 
 * variants: 'default' | 'glass' | 'elevated' | 'flat' | 'bordered'
 */
const Card = ({
  children,
  className = '',
  variant = 'default',
  padding = true,
  hover = false,
  as: Tag = 'div',
  ...props
}) => {
  const variantClasses = {
    default:  'bg-white border border-outline-variant/30 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)]',
    glass:    'glass-card',
    elevated: 'bg-white shadow-ambient border border-outline-variant/20',
    flat:     'bg-surface-container-low border border-outline-variant/20',
    bordered: 'bg-white border-2 border-outline-variant/40',
  };

  return (
    <Tag
      className={[
        'rounded-2xl overflow-hidden',
        variantClasses[variant] ?? variantClasses.default,
        hover ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-ambient-lg cursor-pointer' : '',
        padding ? 'p-6' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </Tag>
  );
};

export const CardHeader = ({ children, className = '', bordered = false }) => (
  <div className={`flex items-center justify-between gap-4 ${bordered ? 'pb-4 mb-4 border-b border-outline-variant/20' : ''} ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, subtitle, className = '' }) => (
  <div className={className}>
    <h3 className="font-bold text-on-surface text-base leading-tight">{children}</h3>
    {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export const CardFooter = ({ children, className = '', bordered = false }) => (
  <div className={`flex items-center justify-between gap-3 ${bordered ? 'pt-4 mt-4 border-t border-outline-variant/20' : ''} ${className}`}>
    {children}
  </div>
);

export default Card;

import React from 'react';
import { FileSearch, Inbox, AlertCircle, SearchX, FolderOpen } from 'lucide-react';

const PRESETS = {
  default:    { icon: Inbox,       title: 'Nothing here',       description: "There's nothing to display at the moment." },
  search:     { icon: SearchX,     title: 'No results',         description: 'Try adjusting your search terms or filters.' },
  tickets:    { icon: FolderOpen,  title: 'No tickets found',   description: 'No tickets match your current criteria.' },
  files:      { icon: FileSearch,  title: 'No files found',     description: 'There are no files in this location.' },
  error:      { icon: AlertCircle, title: 'Something went wrong', description: 'We could not load the content. Please try again.' },
};

/**
 * EmptyState — Premium empty-state component.
 * 
 * Props:
 *   preset    - 'default' | 'search' | 'tickets' | 'files' | 'error'
 *   title     - Override title
 *   message   - Override message
 *   icon      - Override icon (Lucide component)
 *   action    - JSX element (button/link)
 *   compact   - Smaller variant for inline use
 *   className
 */
const EmptyState = ({
  preset = 'default',
  title,
  message,
  icon: IconOverride,
  action,
  compact = false,
  className = '',
}) => {
  const cfg = PRESETS[preset] ?? PRESETS.default;
  const Icon = IconOverride || cfg.icon;
  const resolvedTitle = title || cfg.title;
  const resolvedMessage = message || cfg.description;

  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-10 px-6' : 'py-16 px-8',
        className,
      ].join(' ')}
    >
      {/* Icon container */}
      <div className={`${compact ? 'w-14 h-14' : 'w-20 h-20'} rounded-2xl bg-surface-container-low border border-outline-variant/25 flex items-center justify-center mb-5`}>
        <Icon className={`${compact ? 'w-7 h-7' : 'w-10 h-10'} text-outline-variant`} />
      </div>

      <h3 className={`font-display font-bold text-on-surface ${compact ? 'text-base' : 'text-lg'} mb-2`}>
        {resolvedTitle}
      </h3>
      <p className={`text-on-surface-variant leading-relaxed max-w-xs ${compact ? 'text-xs' : 'text-sm'}`}>
        {resolvedMessage}
      </p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;

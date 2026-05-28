import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface AlertBannerProps {
  message: string;
  onDismiss?: () => void;
  type?: 'warning' | 'error' | 'info';
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  message,
  onDismiss,
  type = 'warning'
}) => {
  let containerBg = 'bg-amber-950/20 border-amber-800/40 text-amber-300';
  let iconColor = 'text-amber-400';

  if (type === 'error') {
    containerBg = 'bg-rose-950/20 border-rose-800/40 text-rose-300';
    iconColor = 'text-rose-400';
  } else if (type === 'info') {
    containerBg = 'bg-blue-950/20 border-blue-800/40 text-blue-300';
    iconColor = 'text-blue-400';
  }

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${containerBg} shadow-sm backdrop-blur-sm transition-all duration-300 animate-fadeIn`}>
      <div className="flex items-center gap-3">
        <AlertCircle className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
        <span className="text-xs font-semibold leading-relaxed">
          {message}
        </span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 transition-colors focus:outline-none"
          title="Dismiss Alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

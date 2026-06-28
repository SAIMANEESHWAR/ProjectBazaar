import React from 'react';
import {
  AlertCircle,
  CloudOff,
  Gauge,
  KeyRound,
  RefreshCw,
  ShieldX,
  WifiOff,
  Box,
  Clock,
} from 'lucide-react';
import type { FormattedProviderError, ProviderErrorCode } from '../lib/formatProviderError';

const ICON_BY_CODE: Record<ProviderErrorCode, React.ComponentType<{ className?: string }>> = {
  INVALID_API_KEY: KeyRound,
  QUOTA_EXCEEDED: Gauge,
  RATE_LIMIT: Clock,
  PROVIDER_OUTAGE: CloudOff,
  MODEL_NOT_FOUND: Box,
  PERMISSION_DENIED: ShieldX,
  NETWORK_ERROR: WifiOff,
  UNKNOWN: AlertCircle,
};

export interface ProviderErrorBannerProps {
  error: FormattedProviderError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
}

const ProviderErrorBanner: React.FC<ProviderErrorBannerProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  compact = false,
}) => {
  const Icon = ICON_BY_CODE[error.code] || AlertCircle;
  const padding = compact ? 'px-3 py-2.5' : 'px-4 py-3';
  const textSize = compact ? 'text-xs' : 'text-sm';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-xl border border-red-200 bg-red-50 ${padding} ${textSize} text-red-900 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} shrink-0 text-red-600 mt-0.5`} aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className={`font-semibold text-red-900 ${compact ? 'text-xs' : 'text-sm'}`}>{error.title}</p>
            <p className={`mt-1 text-red-800/90 ${compact ? 'text-[11px] leading-relaxed' : 'text-sm leading-relaxed'}`}>
              {error.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {error.helpUrl && (
              <a
                href={error.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-800 hover:bg-red-100/60 transition-colors"
              >
                Get help from provider
              </a>
            )}
            {error.retryable && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-800 hover:bg-red-100/60 transition-colors"
              >
                <RefreshCw className="h-3 w-3" aria-hidden />
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-xs font-medium text-red-700/80 hover:text-red-900"
              >
                Dismiss
              </button>
            )}
          </div>

          {error.isProviderIssue && (
            <p className={`text-red-700/70 ${compact ? 'text-[10px]' : 'text-xs'} border-t border-red-200/80 pt-2`}>
              This issue comes from your AI provider and is not a CodeXCareer bug.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderErrorBanner;

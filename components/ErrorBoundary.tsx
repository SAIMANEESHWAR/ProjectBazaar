import { Component, type ErrorInfo, type ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const eventId = Sentry.captureException(error, {
      contexts: { react: { componentStack: info.componentStack ?? '' } },
    });
    this.setState({ errorId: eventId });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            An unexpected error occurred. Our team has been notified and is looking into it.
          </p>

          {this.state.errorId && (
            <p className="text-xs text-gray-400 mb-6 font-mono">
              Reference: {this.state.errorId}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-[#ff7a00] hover:bg-[#e86e00] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-8 text-left">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                Stack trace (dev only)
              </summary>
              <pre className="mt-2 p-3 bg-gray-900 text-red-300 text-xs rounded-lg overflow-auto max-h-48">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

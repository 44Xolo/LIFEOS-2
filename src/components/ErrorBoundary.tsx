import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected application error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F7FC] dark:bg-[#050508] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-fuchsia-600 dark:text-pink-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
                LIFEOS Workspace Recovery
              </h2>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              A runtime or data validation error interrupted the active view. No local data was lost.
            </p>
            <div className="p-3 rounded-lg bg-zinc-100 dark:bg-[#050508] border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 break-words max-h-40 overflow-auto">
              {this.state.message}
            </div>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg lifeos-gradient-bg text-white hover:opacity-95 transition-opacity cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

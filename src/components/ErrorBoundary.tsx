import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-neon-red rounded-xl flex items-center justify-center mx-auto">
                <div className="w-6 h-6 bg-background rounded-sm"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-neon-red">
                  SAM.exe Error
                </h1>
                <p className="text-muted-foreground mt-2">
                  Something went wrong. Please refresh the page.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-neon-blue text-background rounded-lg hover:bg-neon-blue/90"
                >
                  Reload SAM
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
         return this.props.fallback;
      }
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm m-4">
          <h2 className="text-lg font-bold text-red-700 mb-2">Something went wrong in this component.</h2>
          <details className="whitespace-pre-wrap text-sm text-red-600 bg-red-100 p-4 rounded mt-2 overflow-auto max-h-[400px]">
             <summary className="font-semibold cursor-pointer mb-2">View Error Details</summary>
             {this.state.error && this.state.error.toString()}
             <br />
             {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

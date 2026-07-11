import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '../lib/logger'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('render_error', {
      error,
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-lg font-semibold text-red-700">
            Something went wrong.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
          >
            Reload page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

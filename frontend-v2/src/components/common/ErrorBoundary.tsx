import React from "react"
import { AlertTriangle, RefreshCcw } from "lucide-react"
import { Heading, Body } from "../ui/Typography"
import { Link } from "react-router-dom"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    // Here we would integrate with Sentry or LogRocket in production
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <Heading className="mb-4 text-foreground">Something went wrong</Heading>
          <Body className="text-secondary-foreground mb-8 max-w-md">
            We encountered an unexpected error while trying to render this section. 
            Our team has been notified.
          </Body>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-foreground text-background rounded-full font-medium flex items-center gap-2 hover:bg-foreground/90 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload Page
            </button>
            <Link 
              to="/"
              className="px-6 py-2 bg-secondary/50 text-foreground rounded-full font-medium hover:bg-secondary/70 transition-colors"
              onClick={() => this.setState({ hasError: false })}
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

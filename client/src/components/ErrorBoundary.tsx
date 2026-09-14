import { Component, ErrorInfo, ReactNode } from 'react';
import ErrorPage from '../pages/ErrorPage';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('Uncaught render error: ', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            // ErrorPage's default onRetry is a full window.location.reload(), which is
            // the right move here — it clears whatever broken state caused the crash,
            // rather than just re-attempting a render that will likely throw again
            return <ErrorPage message="Something went wrong. Please try reloading the page." />;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
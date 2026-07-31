interface ErrorPageProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
}

function ErrorPage({
    title = 'Something went wrong',
    message = "We couldn't load this. Please try again.",
    onRetry,
}: ErrorPageProps) {
    return (
        <div className="app-shell">
            <main className="status-page">
                <span className="eyebrow">Error</span>
                <h1>{title}</h1>
                <p className="status-page__message">{message}</p>
                <button
                    type="button"
                    className="status-page__action"
                    onClick={onRetry ?? (() => window.location.reload())}
                >
                    Try again
                </button>
            </main>
        </div>
    );
}

export default ErrorPage;
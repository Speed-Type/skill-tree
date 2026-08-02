import './StatusPage.css';

interface LoadingPageProps {
    message?: string;
}

function LoadingPage({ message = "Loading..." }: LoadingPageProps) {
    return (
        <div className="app-shell">
            <main className="status-page">
                <p className="status-page__message">{message}</p>
            </main>
        </div>
    );
}

export default LoadingPage;
import './StatusPage.css';
import './LoadingPage.css';

interface LoadingPageProps {
    message?: string;
}

function LoadingPage({ message = "Loading..." }: LoadingPageProps) {
    return (
        <div className="app-shell">
            <main className="status-page loading-page">
                <svg className="loading-spark" viewBox="0 0 100 82" width="72" height="59" aria-hidden="true">
                    <path className="loading-spark-edge loading-spark-edge-1" d="M50 10 L16 72" />
                    <path className="loading-spark-edge loading-spark-edge-2" d="M50 10 L84 72" />
                    <path className="loading-spark-edge loading-spark-edge-3" d="M16 72 L84 72" />

                    <circle className="loading-spark-node loading-spark-node-1" cx="50" cy="10" r="6" />
                    <circle className="loading-spark-node loading-spark-node-2" cx="16" cy="72" r="6" />
                    <circle className="loading-spark-node loading-spark-node-3" cx="84" cy="72" r="6" />
                </svg>

                <p className="status-page__message loading-page__message">{message}</p>
            </main>
        </div>
    );
}

export default LoadingPage;
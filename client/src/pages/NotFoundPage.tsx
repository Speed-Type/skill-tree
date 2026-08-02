import './StatusPage.css';
import { Link } from 'react-router';

interface NotFoundPageProps {
    title?: string;
    message?: string;
}

function NotFoundPage({
    title = "Can't find that",
    message = "This doesn't exist, or it's private.",
}: NotFoundPageProps) {
    return (
        <div className="app-shell">
            <main className="status-page">
                <span className="eyebrow">404</span>
                <h1>{title}</h1>
                <p className="status-page__message">{message}</p>

                {/* NOTE: To change where the 404 page redirects, modify the 'to' prop in the Link component here */}
                <Link to="/trees" className="status-page__action">
                    Back to your trees
                </Link>
            </main>
        </div>
    );
}

export default NotFoundPage;
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';

function SettingsPage() {
    const { user, logout } = useAuth();

    if (!user) return null; // ProtectedRoute guarantees this is never reached logged-out; this is just for typescript

    // Fun member since metric
    const memberSince = new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="brand">
                    <span className="eyebrow">Skill tree</span>
                    <h1>Account settings</h1>
                    <p className="tagline">Manage your profile, credentials, and account.</p>
                </div>

                <Link className="btn" to="/trees">Back to your trees</Link>
            </header>

            <button className="btn" onClick={logout}>Log out</button>
        </div>
    );
}

export default SettingsPage;
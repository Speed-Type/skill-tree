import './SettingsPage.css';

import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import DisplayNameForm from '../components/settings/DisplayNameForm';
import EmailForm from '../components/settings/EmailForm';
import PasswordForm from '../components/settings/PasswordForm';
import DeleteAccountSection from '../components/settings/DeleteAccountSection';

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

            <main className="app-main settings-main">
                <div className="panel settings-summary">
                    <p><strong>{user.display_name}</strong></p>
                    <p className="settings-form-hint">{user.email}</p>
                    <p className="settings-form-hint">Member since {memberSince}</p>
                    <button className="btn" onClick={logout}>Log out</button>
                </div>

                <div className="panel"><DisplayNameForm /></div>
                <div className="panel"><EmailForm /></div>
                <div className="panel"><PasswordForm /></div>
                <div className="panel settings-danger-panel"><DeleteAccountSection /></div>
            </main>
        </div>
    );
}

export default SettingsPage;
import './SettingsPage.css';

import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import DisplayNameForm from '../components/settings/DisplayNameForm';
import EmailForm from '../components/settings/EmailForm';
import PasswordForm from '../components/settings/PasswordForm';
import DeleteAccountSection from '../components/settings/DeleteAccountSection';

type SettingsSection = 'display_name' | 'email' | 'password' | 'delete' | null;

function SettingsPage() {
    useDocumentTitle('Settings');

    const { user, logout } = useAuth();
    const location = useLocation();
    const [openSection, setOpenSection] = useState<SettingsSection>(null);

    // Opening a section always closes whichever one was open before —
    // toggling the same section again just closes it
    function toggleSection(section: Exclude<SettingsSection, null>) {
        setOpenSection(prev => (prev === section ? null : section));
    }

    // Falls back to /trees if settings was reached directly (bookmark, refresh, typed URL)
    // rather than by clicking a link that recorded where the user came from
    const backTo = (location.state as { from?: string } | null)?.from ?? '/trees';

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

                <Link className="btn" to={backTo}>Back</Link>
            </header>

            <main className="app-main settings-main">
                <div className="panel settings-summary">
                    <p><strong>{user.display_name}</strong></p>
                    <p className="settings-form-hint">{user.email}</p>
                    <p className="settings-form-hint">Member since {memberSince}</p>
                    <button className="btn" onClick={logout}>Log out</button>
                </div>

                <div className="panel">
                    {openSection === 'display_name' ? (
                        <DisplayNameForm onCancel={() => setOpenSection(null)} />
                    ) : (
                        <button
                            type="button"
                            className="btn settings-section-toggle"
                            onClick={() => toggleSection('display_name')}
                        >
                            Change Display Name
                        </button>
                    )}
                </div>
                
                <div className="panel">
                    {openSection === 'email' ? (
                        <EmailForm onCancel={() => setOpenSection(null)} />
                    ) : (
                        <button
                            type="button"
                            className="btn settings-section-toggle"
                            onClick={() => toggleSection('email')}
                        >
                            Change Email
                        </button>
                    )}
                </div>

                <div className="panel">
                    {openSection === 'password' ? (
                        <PasswordForm onCancel={() => setOpenSection(null)} />
                    ) : (
                        <button
                            type="button"
                            className="btn settings-section-toggle"
                            onClick={() => toggleSection('password')}
                        >
                            Change Password
                        </button>
                    )}
                </div>

                <div className="panel settings-danger-panel">
                    {openSection === 'delete' ? (
                        <DeleteAccountSection onCancel={() => setOpenSection(null)} />
                    ) : (
                        <button
                            type="button"
                            className="btn btn-danger settings-section-toggle"
                            onClick={() => toggleSection('delete')}
                        >
                            Delete Account
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}

export default SettingsPage;
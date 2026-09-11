import './AuthGate.css';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router';
import { MAX_LENGTHS, PASSWORD_MIN_LENGTH    } from '../../../../shared/constants';

function AuthGate() {
    const { login, signup } = useAuth();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (mode === 'login') await login(email, password);
            else await signup(email, displayName, password);
        }
        catch (err) {
            console.error('Failed to submit authentication form: ', err);
        }
        finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="auth-shell">
            <Link className="btn btn-icon auth-back-link" to="/" title="Back to home">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 19-7-7 7-7"/>
                    <path d="M19 12H5"/>
                </svg>
                <span>Back</span>
            </Link>

            <div className="auth-card panel">
                <div className="brand">
                    <span className="eyebrow">Skill tree</span>
                    <h2>{mode === 'login' ? 'Log in' : 'Sign up'}</h2>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <input
                        className="input"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                        maxLength={MAX_LENGTHS.userEmail}
                    />
                    {/* Purposefully no character limit display: <CharCounter value={email} max={MAX_LENGTHS.userEmail} /> */}
                    
                    {/* Display name input only appears for signup */}
                    {mode === 'signup' && (
                        <input
                            className="input"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder="Display name"
                            required
                            maxLength={MAX_LENGTHS.displayName}
                        />
                    )}

                    <input
                        className="input"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        minLength={mode === 'signup' ? PASSWORD_MIN_LENGTH : undefined}
                    />
                    <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'One moment…' : (mode === 'login' ? 'Log in' : 'Sign up')}
                    </button>
                </form>

                <button className="btn-link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                    {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
                </button>
            </div>
        </div>
    );
}

export default AuthGate;

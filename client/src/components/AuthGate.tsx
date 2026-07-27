import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

function AuthGate() {
    const { login, signup } = useAuth();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        try {
            if (mode === 'login') await login(email, password);
            else await signup(email, password);
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Something went wrong');
        }
    }

    return (
        <div className="auth-shell">
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
                    />
                    <input
                        className="input"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                    />
                    <button className="btn btn-primary" type="submit">{mode === 'login' ? 'Log in' : 'Sign up'}</button>
                </form>


                {error && <p className="error-text">{error}</p>}

                <button className="btn-link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                    {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
                </button>
            </div>
        </div>
    );
}

export default AuthGate;
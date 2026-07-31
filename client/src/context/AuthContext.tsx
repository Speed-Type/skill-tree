import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PublicUser } from '../../../shared/types';
import { apiFetch, ApiError } from '../lib/api';

interface AuthContextValue {
    user: PublicUser | null;
    loading: boolean;
    authError: ApiError | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<PublicUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<ApiError | null>(null);

    // On first load, check whether we already have a valid cookie from a previous session
    useEffect(() => {
        apiFetch<PublicUser>('/users/me', { silent: true})
            .then(setUser)
            .catch((err) => {
                if (err instanceof ApiError && err.status === 401) {
                    setUser(null); // no valid cookie — just means logged out, not an error to surface
                } else if (err instanceof ApiError) {
                    setAuthError(err); // real failure (network/server), distinct from "logged out"
                } else {
                    // Defensive fallback: apiFetch should _always_ throw ApiError, but just in case
                    setAuthError(new ApiError('Unknown error', 0));
                }
            })
            .finally(() => setLoading(false));
    }, []);

    async function login(email: string, password: string) {
        const loggedInUser = await apiFetch<PublicUser>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        setUser(loggedInUser);
        setAuthError(null);
    }

    async function signup(email: string, password: string) {
        await apiFetch<PublicUser>('/users', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        await login(email, password); // signup doesn't log you in on its own — chain into login
    }

    async function logout() {
        await apiFetch('/auth/logout', { method: 'POST' });
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, authError, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
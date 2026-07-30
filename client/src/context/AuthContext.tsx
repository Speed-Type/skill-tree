import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PublicUser } from '../../../shared/types';
import { apiFetch } from '../lib/api';

interface AuthContextValue {
    user: PublicUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<PublicUser | null>(null);
    const [loading, setLoading] = useState(true);

    // On first load, check whether we already have a valid cookie from a previous session
    useEffect(() => {
        apiFetch<PublicUser>('/users/me', { silent: true})
            .then(setUser)
            .catch(() => setUser(null)) // no valid cookie — just means logged out, not an error to surface
            .finally(() => setLoading(false));
    }, []);

    async function login(email: string, password: string) {
        const loggedInUser = await apiFetch<PublicUser>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        setUser(loggedInUser);
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
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
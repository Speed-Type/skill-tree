import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PublicUser } from '../../../shared/types';
import { apiFetch, ApiError } from '../lib/api';

interface AuthContextValue {
    user: PublicUser | null;
    loading: boolean;
    authError: ApiError | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, display_name: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateDisplayName: (display_name: string) => Promise<void>;
    updateEmail: (email: string, current_password: string) => Promise<void>;
    updatePassword: (password: string, current_password: string) => Promise<void>;
    deleteAccount: (current_password: string) => Promise<void>;
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

    async function signup(email: string, display_name: string, password: string) {
        await apiFetch<PublicUser>('/users', {
            method: 'POST',
            body: JSON.stringify({ email, display_name, password }),
        });
        await login(email, password); // signup doesn't log you in on its own — chain into login
    }

    async function logout() {
        await apiFetch('/auth/logout', { method: 'POST' });
        setUser(null);
    }

    async function updateDisplayName(display_name: string) {
        const updatedUser = await apiFetch<PublicUser>('/users/me', {
            method: 'PUT',
            body: JSON.stringify({ display_name }),
        });
        setUser(updatedUser);
    }

    async function updateEmail(email: string, current_password: string) {
        const updatedUser = await apiFetch<PublicUser>('/users/me', {
            method: 'PUT',
            body: JSON.stringify({ email, current_password }),
        });
        setUser(updatedUser);
    }

    async function updatePassword(password: string, current_password: string) {
        await apiFetch<PublicUser>('/users/me', {
            method: 'PUT',
            body: JSON.stringify({ password, current_password }),
        });
        // Don't need to setPassword because password is never saved locally anyways
    }

    async function deleteAccount(current_password: string) {
        await apiFetch('/users/me', {
            method: 'DELETE',
            body: JSON.stringify({ current_password }),
        });
        setUser(null); // ProtectedRoute will bounce to /login once this clears
    }

    return (
        <AuthContext.Provider value={{ user, loading, authError, login, signup, logout, updateDisplayName, updateEmail, updatePassword, deleteAccount }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
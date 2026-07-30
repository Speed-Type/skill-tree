import { snackbar } from './snackbar';

const API_BASE = import.meta.env.VITE_API_BASE;

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export interface ApiFetchOptions extends RequestInit {
    // Set true to suppress the automatic error snackbar for this call
    // Useful for calls where a failure is expected/handled inline
    // (e.g. an initial auth check that may legitimately 401)
    silent?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    const { silent, ...fetchOptions } = options;
    
    const res = await fetch(`${API_BASE}${path}`, {
        ...fetchOptions,
        credentials: 'include', // sends the auth cookie on every request
        headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
        },
    });

    if (!res.ok) {
        let message = `Request failed: ${res.status}`;
        try {
            const errorData = await res.json();
            message = errorData.error || message;
        } catch {
            // response body wasn't JSON — fall back to the generic message
        }
        if (!silent) snackbar.error(message);
        throw new ApiError(message, res.status);
    }

    if (res.status === 204) return undefined as T; // DELETE responses have no body
    return res.json();
}
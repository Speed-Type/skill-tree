import { snackbar } from './snackbar';

const API_BASE = import.meta.env.VITE_API_BASE;

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export const NETWORK_ERROR_MESSAGE = "Can't reach the server. Check your connection and try again.";

export interface ApiFetchOptions extends RequestInit {
    // Set true to suppress the automatic error snackbar for this call
    // Useful for calls where a failure is expected/handled inline
    // (e.g. an initial auth check that may legitimately 401)
    silent?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    const { silent, ...fetchOptions } = options;
    
    let res: Response;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            ...fetchOptions,
            credentials: 'include', // sends the auth cookie on every request
            headers: {
                'Content-Type': 'application/json',
                ...fetchOptions.headers,
            },
        });
    } catch {
        // fetch() itself threw — server unreachable, offline, DNS failure, etc.
        // There's no Response here, so this can't be a 401/404/etc — it's always
        // a connectivity problem. Status 0 is a convention for "not an HTTP status."
        const message = NETWORK_ERROR_MESSAGE;
        if (!silent) snackbar.error(message);
        throw new ApiError(message, 0);
    }

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
const API_BASE = import.meta.env.VITE_API_BASE;

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        credentials: 'include', // sends the auth cookie on every request
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
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
        throw new ApiError(message, res.status);
    }

    if (res.status === 204) return undefined as T; // DELETE responses have no body
    return res.json();
}
// server/utils/slug.ts
import crypto from 'crypto';

// 8 random bytes -> 11-char base64url string, e.g. "k3Jc9zQ1mXo"
// Collision odds are astronomically small, but the insert below still
// handles it gracefully just in case
export function generateSlug(): string {
    return crypto.randomBytes(8).toString('base64url');
}
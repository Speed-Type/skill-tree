import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Cloudflare sets this header at their edge to the original client IP, and it can't
// be spoofed by the client (Cloudflare overwrites whatever the client sent). This is
// more reliable than counting X-Forwarded-For hops via Express's trust proxy setting,
// since the exact number of intermediate hops Render/Cloudflare insert isn't always
// constant. Falls back to req.ip for local dev, where this header won't be present.
function resolveClientIp(req: Request): string {
    const cfIp = req.headers['cf-connecting-ip'];
    if (typeof cfIp === 'string' && cfIp.length > 0) return cfIp;
    return req.ip ?? 'unknown';
}

interface RequestWithRateLimit extends Request {
    rateLimit?: {
        resetTime?: Date;
    };
}

// Builds a "try again in Xm Ys" style message from the store's resetTime,
// so a rate-limited response tells the person exactly how long to wait
// instead of a generic "try again later"
function rateLimitHandler(baseMessage: string) {
    return (req: Request, res: Response, _next: NextFunction) => {
        const resetTime = (req as RequestWithRateLimit).rateLimit?.resetTime;
        let waitMessage = '';

        if (resetTime) {
            const msRemaining = resetTime.getTime() - Date.now();
            const secondsRemaining = Math.max(0, Math.ceil(msRemaining / 1000));
            const minutes = Math.floor(secondsRemaining / 60);
            const seconds = secondsRemaining % 60;

            if (minutes > 0) {
                waitMessage = ` Try again in ${minutes}m ${seconds}s.`;
            } else {
                waitMessage = ` Try again in ${seconds}s.`;
            }
        }

        res.status(429).json({ error: `${baseMessage}${waitMessage}` });
    };
}

// General-purpose baseline for every route
// Generous enough not to bother normal usage, just there to cover 
// blunt scraping/abuse that isn't already covered by a more specific limiter

// Skips certain high-frequency, low-risk traffic like repositioning nodes

const isHighFrequencyBenignRoute = (req: Request) =>
    (req.method === 'PUT' && /^\/skills\/\d+\/position$/.test(req.path)) ||
    (req.method === 'POST' && req.path === '/edges') ||
    (req.method === 'DELETE' && /^\/edges\/\d+$/.test(req.path));

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: isHighFrequencyBenignRoute,
    keyGenerator: resolveClientIp,
    handler: rateLimitHandler('Too many requests.'),
});

// Dedicated limiter for edge creation specifically
// Exempted from the global count (see isHighFrequencyBenignRoute above)
export const edgeCreationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: resolveClientIp,
    handler: rateLimitHandler('Too many connections created.'),
});

// Brute-force guard for login: keyed by IP, fairly strict since a real user
// rarely needs more than a handful of attempts in 15 minutes
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: resolveClientIp,
    handler: rateLimitHandler('Too many login attempts.'),
});

// Signup abuse guard: prevents mass account creation / bcrypt-hashing spam from one IP
export const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: resolveClientIp,
    handler: rateLimitHandler('Too many accounts created from this IP.'),
});

// Reauth guard: same brute-force concern as login, applies to email/password change
// and account deletion, which all require current_password
export const reauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: resolveClientIp,
    handler: rateLimitHandler('Too many attempts.'),
});
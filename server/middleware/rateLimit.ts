import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// General-purpose baseline for every route
// Generous enough not to bother normal usage, just there to cover 
// blunt scraping/abuse that isn't already covered by a more specific limiter
//
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
    message: { error: 'Too many requests. Please try again later.' },
});

// Dedicated limiter for edge creation specifically
// Exempted from the global count (see isHighFrequencyBenignRoute above)
export const edgeCreationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many connections created. Please try again later.' },
});

// Brute-force guard for login: keyed by IP, fairly strict since a real user
// rarely needs more than a handful of attempts in 15 minutes
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again later.' },
});

// Signup abuse guard: prevents mass account creation / bcrypt-hashing spam from one IP
export const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many accounts created from this IP. Please try again later.' },
});

// Reauth guard: same brute-force concern as login, applies to email/password change
// and account deletion, which all require current_password
export const reauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again later.' },
});
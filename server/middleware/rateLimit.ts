import rateLimit from 'express-rate-limit';

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
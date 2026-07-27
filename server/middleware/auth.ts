import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const payload = verifyToken(token);
        req.userId = payload.userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.token;

    if (token) {
        try {
            const payload = verifyToken(token);
            req.userId = payload.userId;
        } catch {
            // Invalid/expired token — just treat the request as anonymous, don't block it
        }
    }

    next();
}
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db';
import { signToken } from '../utils/jwt';
import { ErrorResponse, PublicUser } from '../../shared/types';

const router = Router();

interface LoginBody {
    email: string;
    password: string;
}

router.post('/login', async (req: Request<{}, {}, LoginBody>, res: Response<PublicUser | ErrorResponse>) => {
    try {
        
        const { email, password } = req.body;

        // Make sure required parameters (email and password) are passed
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        const result = await pool.query(
            'SELECT id, email, display_name, password_hash, created_at FROM users WHERE email = $1',
            [email]
        );
        const user = result.rows[0];

        // Same error for "no such user" and "wrong password" — don't reveal which one it was
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const passwordMatches = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatches) return res.status(401).json({ error: 'Invalid email or password' });

        const token = signToken({ userId: user.id });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // only over HTTPS in prod
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, in ms — should match the JWT's expiresIn
        });

        res.status(200).json({ id: user.id, email: user.email, display_name: user.display_name, created_at: user.created_at });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('token');
    res.status(204).send();
});

export default router;
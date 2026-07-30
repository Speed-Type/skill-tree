import { Router, Request, Response} from 'express';
import { User, PublicUser, ErrorResponse } from '../../shared/types';
import { isPgError } from '../utils/utils';
import { requireAuth } from '../middleware/auth';
import bcrypt from 'bcrypt';

import pool from '../db';

const router = Router();

router.get('/me', requireAuth, async (req: Request, res: Response<PublicUser | ErrorResponse>) => {
    try {
        const result = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [req.userId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/:id', requireAuth, async (req: Request<{ id: string }>, res: Response<PublicUser | ErrorResponse>) => {
    try {
        const result = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err); // Log what actually broke

        // Check for invalid id parameter
        if (isPgError(err) && err.code === '22P02') return res.status(400).json({ error: 'Invalid id' });

        res.status(500).json({ error: 'Database error' }); // Client gets a response
    }
});

interface CreateUserBody {
    email: string;
    password: string;
}

router.post('/', async (req: Request<{}, {}, CreateUserBody>, res: Response<PublicUser | ErrorResponse>) => {
    try {
        
        const { email, password } = req.body;

        // Make sure required parameters (email and password) are passed
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        // Encryption
        const password_hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
            [email, password_hash]
        );
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error(err); // Log what actually broke 

        // Check if it's a duplicate user violation
        if (isPgError(err) && err.code === "23505") return res.status(409).json({ error: "This email already exists" });
        
        res.status(500).json({ error: 'Database error' }); // Client gets a response
    }
});

interface UpdateUserBody {
    email?: string;
    password?: string;
}

router.put('/me', requireAuth, async(req: Request<{ id: string }, {}, UpdateUserBody>, res: Response<PublicUser | ErrorResponse>) => {
    try {
        const { email, password } = req.body;

        // Encryption
        let password_hash = undefined;
        if(password) password_hash = await bcrypt.hash(password, 10); //bcrypt.hash won't work with a null password, so only encrypt when password was passed

        const result = await pool.query(
            'UPDATE users SET email = COALESCE($1, email), password_hash = COALESCE($2, password_hash) WHERE id = $3 RETURNING id, email, created_at',
            [email, password_hash, req.userId]
        );

        // Check that the PUT was successful
        if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        res.status(200).json(result.rows[0]);
    }
    catch (err) {
        console.error(err); // Log what actually broke
        
        // First check if it's a duplicate user violation
        if (isPgError(err) && err.code === "23505") return res.status(409).json({ error: "This email already exists" });

        res.status(500).json({ error: 'Database error' }); // Client gets a response
    }
});

// NOTE: The delete endpoint currently cascade deletes ALL of the user data; that might be something to change later

router.delete('/me', requireAuth, async(req: Request<{ id: string }>, res: Response<ErrorResponse>) => {
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.userId]);

        // Check that DELETE was successful
        if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        
        res.status(204).send();
    }
    catch (err) {
        console.error(err); // Log what actually broke
        
        res.status(500).json({ error: 'Database error' }); // Client gets a response
    }
});

export default router;
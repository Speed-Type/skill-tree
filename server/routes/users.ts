import { Router, Request, Response} from 'express';
import { User, PublicUser, ErrorResponse } from '../types';
import { isPgError } from '../utils';

import pool from '../db';

const router = Router();

router.get('/', async (req: Request, res: Response<PublicUser[] | ErrorResponse>) => {
    try {
        const result = await pool.query('SELECT id, email, created_at FROM users');
	    res.json(result.rows);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

router.get('/:id', async (req: Request<{ id: string }>, res: Response<PublicUser | ErrorResponse>) => {
    try {
        const result = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

interface CreateUserBody {
    email: string;
    password: string;
}

const bcrypt = require('bcrypt'); // Necessary for server-side hashing

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
        // First check if it's a duplicate user violation
        if (isPgError(err) && err.code === "23505") return res.status(409).json({ error: "This email already exists" });

        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

interface UpdateUserBody {
    email?: string;
    password?: string;
}

router.put('/:id', async(req: Request<{ id: string }, {}, UpdateUserBody>, res: Response<PublicUser | ErrorResponse>) => {
    try {
        const { email, password } = req.body;

        // Encryption
        let password_hash = undefined;
        if(password) password_hash = await bcrypt.hash(password, 10); //bcrypt.hash won't work with a null password, so only encrypt when password was passed

        const result = await pool.query(
            'UPDATE users SET email = COALESCE($1, email), password_hash = COALESCE($2, password_hash) WHERE id = $3 RETURNING id, email, created_at',
            [email, password_hash, req.params.id]
        );

        // Check that the PUT was successful
        if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        res.status(200).json(result.rows[0]);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

// NOTE: The delete endpoint currently cascade deletes ALL of the user data; that might be something to change later

router.delete('/:id', async(req: Request<{ id: string }>, res: Response<ErrorResponse>) => {
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);

        // Check that DELETE was successful
        if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        
        res.status(204).send();
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

export default router;
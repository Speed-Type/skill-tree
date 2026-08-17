import { Router, Request, Response} from 'express';
import { PublicUser, ErrorResponse } from '../../shared/types';
import { isPgError } from '../utils/utils';
import { requireAuth } from '../middleware/auth';
import { MAX_LENGTHS } from '../../shared/constants';
import bcrypt from 'bcrypt';

import pool from '../db';

const router = Router();

router.get('/me', requireAuth, async (req: Request, res: Response<PublicUser | ErrorResponse>) => {
    try {
        const result = await pool.query('SELECT id, email, display_name, created_at FROM users WHERE id = $1', [req.userId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

interface CreateUserBody {
    email: string;
    display_name?: string; // Is optional here, but if it is passed as null then in POST / it will be given a default value
    password: string;
}

router.post('/', async (req: Request<{}, {}, CreateUserBody>, res: Response<PublicUser | ErrorResponse>) => {
    try {
        
        const { email, display_name, password } = req.body;

        // Make sure required parameters (email and password) are passed
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        // email has a character limit; catch it before it hits the DB
        if (email.length > MAX_LENGTHS.userEmail) return res.status(400).json({ error: `Email must be ${MAX_LENGTHS.userEmail} characters or fewer`  });

        // if display_name exists, it has a character limit; catch it before it hits the DB
        if (display_name && display_name.length > MAX_LENGTHS.displayName) return res.status(400).json({ error: `Display name must be ${MAX_LENGTHS.displayName} characters or fewer`  });

        // Encryption
        const password_hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (email, display_name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, display_name, created_at',
            [email, display_name || 'Anonymous User', password_hash] // Default display name here
        );
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error(err); // Log what actually broke 

        // Check for duplicate user violation
        if (isPgError(err) && err.code === "23505") return res.status(409).json({ error: "This email already exists" });

        if (isPgError(err) && err.code === "22001") return res.status(400).json({ error: "One or more fields is too long" });

        res.status(500).json({ error: 'Database error' });
    }
});

interface UpdateUserBody {
    email?: string;
    display_name?: string;
    password?: string;
    current_password?: string; // Required to change email or password
}

router.put('/me', requireAuth, async(req: Request<{ id: string }, {}, UpdateUserBody>, res: Response<PublicUser | ErrorResponse>) => {
    try {
        const { email, display_name, password, current_password } = req.body;

        // email has a character limit; catch it before it hits the DB
        if (email && email.length > MAX_LENGTHS.userEmail) return res.status(400).json({ error: `Email must be ${MAX_LENGTHS.userEmail} characters or fewer` });

        // display_name has a character limit; catch it before it hits the DB
        if (display_name && display_name.length > MAX_LENGTHS.displayName) return res.status(400).json({ error: `Display name must be ${MAX_LENGTHS.displayName} characters or fewer`  });

        // Changing email or password is sensitive, so require proof you're still the account holder,
        // so a hijacked/left-open session can't silently take over the account
        if (email || password) {
            if (!current_password) return res.status(400).json({ error: 'Current password is required to change your email or password' });

            const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
            if (userResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });

            const currentPasswordMatches = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
            if (!currentPasswordMatches) return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Encryption
        let password_hash = undefined;
        if (password) password_hash = await bcrypt.hash(password, 10); //bcrypt.hash won't work with a null password, so only encrypt when password was passed

        const result = await pool.query(
            `UPDATE users SET email = COALESCE($1, email), 
            display_name = COALESCE($2, display_name), 
            password_hash = COALESCE($3, password_hash) 
            WHERE id = $4 
            RETURNING id, email, display_name, created_at`,
            [email, display_name || null, password_hash, req.userId]
            // Note that display_name || null is used to prevent display_name from being the empty string ''
            // If it is the empty string '', then display_name will be passed as null, and COALESCE will make sure it has no effect
        );

        // Check that the PUT was successful
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        res.status(200).json(result.rows[0]);
    }
    catch (err) {
        console.error(err); // Log what actually broke

        // Check for duplicate user violation
        if (isPgError(err) && err.code === "23505") return res.status(409).json({ error: "This email already exists" });

        if (isPgError(err) && err.code === "22001") return res.status(400).json({ error: "One or more fields is too long" });

        res.status(500).json({ error: 'Database error' });
    }
});

interface DeleteUserBody {
    current_password: string;
}

// NOTE: The delete endpoint currently cascade deletes ALL of the user data; that might be something to change later
router.delete('/me', requireAuth, async(req: Request<{}, {}, DeleteUserBody>, res: Response<ErrorResponse>) => {
    try {
        // Check for reauth
        const { current_password } = req.body;
        if (!current_password) return res.status(400).json({ error: 'Current password is required to delete your account' });

        const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
        if (userResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        const currentPasswordMatches = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
        if (!currentPasswordMatches) return res.status(401).json({ error: 'Current password is incorrect' });

        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.userId]);

        // Check that DELETE was successful
        if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        
        res.status(204).send();
    }
    catch (err) {
        console.error(err); // Log what actually broke
        
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;
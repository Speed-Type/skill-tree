import { Router, Request, Response } from 'express';
import { Status, ErrorResponse } from '../../shared/types';
import { requireAuth, optionalAuth } from '../middleware/auth';

import pool from '../db';

const router = Router();

router.get('/', requireAuth, async(req: Request, res: Response<Status[] | ErrorResponse>) => {
    try {
        const result = await pool.query('SELECT * FROM statuses WHERE user_id = $1', [req.userId]);
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

router.get('/:id', optionalAuth, async(req: Request<{ id: string }>, res: Response<Status | ErrorResponse>) => {
    try {
        const result = req.userId
            ? await pool.query(
                `SELECT * FROM statuses st
                 WHERE st.id = $1
                 AND (st.user_id = $2
                 OR st.id IN (
                     SELECT sk.status_id FROM skills sk
                     JOIN skill_trees t ON sk.tree_id = t.id
                     WHERE t.is_public = true AND sk.status_id IS NOT NULL
                 ))`,
                [req.params.id, req.userId]
              )
            : await pool.query(
                `SELECT * FROM statuses st
                 WHERE st.id = $1
                 AND st.id IN (
                     SELECT sk.status_id FROM skills sk
                     JOIN skill_trees t ON sk.tree_id = t.id
                     WHERE t.is_public = true AND sk.status_id IS NOT NULL
                 )`,
                [req.params.id]
              );

        // Make sure the status exists to begin with
        if(result.rows.length === 0) return res.status(404).json({ error: "Not found" });

        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

interface CreateStatusBody {
    label: string;
    sort_order?: number;
}

router.post('/', requireAuth, async(req: Request<{}, {}, CreateStatusBody>, res: Response<Status | ErrorResponse>) => {
    try {
        const { label, sort_order } = req.body;

        // Make sure required parameters (label) are passed
        if (!label) return res.status(400).json({ error: "Label is required" });

        const result = await pool.query(
            'INSERT INTO statuses (user_id, label, sort_order) VALUES ($1, $2, $3) RETURNING *', 
            [req.userId, label, sort_order ?? 0]
        );

        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

interface UpdateStatusBody {
    label?: string;
    sort_order?: number;
}

router.put('/:id', requireAuth, async(req: Request<{ id: string }, {}, UpdateStatusBody>, res: Response<Status | ErrorResponse>) => {
    try {
        const { label, sort_order } = req.body;

        const result = await pool.query(
            'UPDATE statuses SET label = COALESCE($1, label), sort_order = COALESCE($2, sort_order) WHERE id = $3 AND user_id = $4 RETURNING *',
            [label, sort_order, req.params.id, req.userId]
        );

        // Check that the PUT was successful
        if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

router.delete('/:id', requireAuth, async(req: Request<{ id: string }>, res: Response<ErrorResponse>) => {
    try {
        const result = await pool.query('DELETE FROM statuses WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.userId]);

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
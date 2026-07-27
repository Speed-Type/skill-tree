import { Router, Request, Response } from 'express';
import { Skill, ErrorResponse } from '../../shared/types';
import { requireAuth, optionalAuth } from '../middleware/auth';

import pool from '../db';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response<Skill[] | ErrorResponse>) => {
    try {
        const result = await pool.query(
            `SELECT * FROM skills WHERE tree_id IN (SELECT id FROM skill_trees WHERE user_id = $1)`,
            [req.userId]
        );

        res.json(result.rows);
    }
    catch (err) {
        console.error(err); // Log what actually broke
        res.status(500).json({ error: 'Database error' }); // Client gets a response
    }
});

router.get('/:id', optionalAuth, async (req: Request<{ id: string }>, res: Response<Skill | ErrorResponse>) => {
    try {
        const result = req.userId
            ? await pool.query(
                `SELECT s.* FROM skills s
                 JOIN skill_trees t ON s.tree_id = t.id
                 WHERE s.id = $1 AND (t.is_public = true OR t.user_id = $2)`,
                [req.params.id, req.userId]
            )
            : await pool.query(
                `SELECT s.* FROM skills s
                 JOIN skill_trees t ON s.tree_id = t.id
                 WHERE s.id = $1 AND t.is_public = true`,
                [req.params.id]
            );

        // Make sure the skill exists to begin with
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err); // Log what actually broke
        res.status(500).json({ error: 'Database error' }); // Client gets a response
    }
});

interface CreateSkillBody {
    tree_id: number;
    label: string;
    description?: string;
    status_id?: number;
    x_position?: number;
    y_position?: number;
}

router.post('/', requireAuth, async (req: Request<{}, {}, CreateSkillBody>, res: Response<Skill | ErrorResponse>) => {
    try {
        const { tree_id, label, description, status_id, x_position, y_position } = req.body;

        // Make sure required parameters are passed
        if (!tree_id || !label) return res.status(400).json({ error: 'Tree id and label are required' });

        // Confirm the tree exists AND belongs to the requester before allowing an insert into it
        const treeCheck = await pool.query('SELECT id FROM skill_trees WHERE id = $1 AND user_id = $2', [tree_id, req.userId]);
        if (treeCheck.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        const result = await pool.query(
            'INSERT INTO skills (tree_id, label, description, status_id, x_position, y_position) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [tree_id, label, description ?? null, status_id ?? null, x_position ?? 0, y_position ?? 0]
        );

        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error(err); // Log what actually broke
        res.status(500).json({ error: 'Database error' }); // Client gets a response
    }
});

interface UpdateSkillBody {
    label?: string;
    description?: string;
    status_id?: number;
    x_position?: number;
    y_position?: number;
}

router.put('/:id', requireAuth, async (req: Request<{ id: string }, {}, UpdateSkillBody>, res: Response<Skill | ErrorResponse>) => {
    try {
        const { label, description, status_id, x_position, y_position } = req.body;

        const result = await pool.query(
            `UPDATE skills SET label = COALESCE($1, label), description = COALESCE($2, description), status_id = COALESCE($3, status_id),
             x_position = COALESCE($4, x_position), y_position = COALESCE($5, y_position)
             WHERE id = $6 AND tree_id IN (SELECT id FROM skill_trees WHERE user_id = $7)
             RETURNING *`,
            [label, description, status_id, x_position, y_position, req.params.id, req.userId]
        );

        // Check that the PUT was successful
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

router.put('/:id/status', requireAuth, async (req: Request<{ id: string }, {}, { status_id: number | null }>, res: Response<Skill | ErrorResponse>) => {
    try {
        const { status_id } = req.body;

        const result = await pool.query(
            `UPDATE skills SET status_id = $1
             WHERE id = $2 AND tree_id IN (SELECT id FROM skill_trees WHERE user_id = $3)
             RETURNING *`,
            [status_id, req.params.id, req.userId]
        );

        // Check that the PUT was successful
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err); // Log what actually broke
        res.status(500).json({ error: 'Database error' }); // Client gets a response
    }
});

router.put('/:id/position', requireAuth, async (req: Request<{ id: string }, {}, { x_position?: number, y_position?: number }>, res: Response<Skill | ErrorResponse>) => {
    try {
        const { x_position, y_position } = req.body;

        const result = await pool.query(
            `UPDATE skills SET x_position = COALESCE($1, x_position), y_position = COALESCE($2, y_position)
             WHERE id = $3 AND tree_id IN (SELECT id FROM skill_trees WHERE user_id = $4)
             RETURNING *`,
            [x_position, y_position, req.params.id, req.userId]
        );

        // Check that the PUT was successful
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

router.delete('/:id', requireAuth, async (req: Request<{ id: string }>, res: Response<ErrorResponse>) => {
    try {
        const result = await pool.query(
            `DELETE FROM skills WHERE id = $1 AND tree_id IN (SELECT id FROM skill_trees WHERE user_id = $2) RETURNING id`,
            [req.params.id, req.userId]
        );

        // Check that DELETE was successful
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        res.status(204).send();
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

export default router;
import { Router, Request, Response } from 'express';
import { SkillEdge, ErrorResponse } from '../../shared/types';
import { isPgError } from '../utils/utils';
import { requireAuth, optionalAuth } from '../middleware/auth';

import pool from '../db';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response<SkillEdge[] | ErrorResponse>) => {
    try {
        const result = await pool.query(
            `SELECT * FROM skill_edges WHERE from_skill_id IN (
            SELECT id FROM skills WHERE tree_id IN (SELECT id FROM skill_trees WHERE user_id = $1))`,
            [req.userId]
        );

        res.json(result.rows);
    }
    catch (err) {
        console.error(err); // Log what actually broke
        res.status(500).json({ error: 'Database error' }); // Client gets a response
    }
});

router.get('/:id', optionalAuth, async (req: Request<{ id: string }>, res: Response<SkillEdge | ErrorResponse>) => {
    try {
        const result = req.userId
            ? await pool.query(
                `SELECT e.* FROM skill_edges e
                 JOIN skills s ON e.from_skill_id = s.id
                 JOIN skill_trees t ON s.tree_id = t.id
                 WHERE e.id = $1 AND (t.is_public = true OR t.user_id = $2)`,
                [req.params.id, req.userId]
            )
            : await pool.query(
                `SELECT e.* FROM skill_edges e
                 JOIN skills s ON e.from_skill_id = s.id
                 JOIN skill_trees t ON s.tree_id = t.id
                 WHERE e.id = $1 AND t.is_public = true`,
                [req.params.id]
            );

        // Make sure the skill edge exists to begin with
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

interface CreateEdgeBody {
    from_skill_id: number;
    to_skill_id: number;
}

router.post('/', requireAuth, async (req: Request<{}, {}, CreateEdgeBody>, res: Response<SkillEdge | ErrorResponse>) => {
    try {
        const { from_skill_id, to_skill_id } = req.body;

        // Make sure required parameters (email and password) are passed
        if (!from_skill_id || !to_skill_id) return res.status(400).json({ error: "To/from skill id's are required" });

        // Make sure a skill edge does not point both to and from itself
        if (from_skill_id === to_skill_id) return res.status(409).json({ error: "A skill cannot point to itself" });

        // Confirm both skills exist, belong to the same tree, and that tree belongs to the requester
        const treeCheck = await pool.query(
            `SELECT DISTINCT tree_id FROM skills
             WHERE id IN ($1, $2) AND tree_id IN (SELECT id FROM skill_trees WHERE user_id = $3)`,
            [from_skill_id, to_skill_id, req.userId]
        );
        if (treeCheck.rows.length !== 1) return res.status(404).json({ error: 'Not found' });

        const result = await pool.query('INSERT INTO skill_edges (from_skill_id, to_skill_id) VALUES ($1, $2) RETURNING *', [from_skill_id, to_skill_id]);

        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        // First check if it's a duplicate edge violation
        if (isPgError(err) && err.code === "23505") return res.status(409).json({ error: "This edge already exists" });

        console.error(err); // Log what actually broke
        res.status(500).json({ error: 'Database error' }); // Client gets a response
    }
});

router.delete('/:id', requireAuth, async (req: Request<{ id: string }>, res: Response<ErrorResponse>) => {
    try {
        const result = await pool.query(
            `DELETE FROM skill_edges WHERE id = $1
             AND from_skill_id IN (SELECT id FROM skills WHERE tree_id IN (SELECT id FROM skill_trees WHERE user_id = $2))
             RETURNING id`,
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
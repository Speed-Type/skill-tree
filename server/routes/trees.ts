import { Router, Request, Response } from 'express';
import { Skill, SkillTree, TreeWithDetails, ErrorResponse } from '../../shared/types';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { isPgError } from '../utils/utils';
import { MAX_LENGTHS } from '../../shared/constants';

import pool from '../db';

const router = Router();

router.get('/', requireAuth, async(req: Request, res: Response<SkillTree[] | ErrorResponse>) => {
    try {
        const result = await pool.query('SELECT * FROM skill_trees WHERE user_id = $1', [req.userId]);
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/:id', optionalAuth, async(req: Request<{ id: string }>, res: Response<TreeWithDetails | ErrorResponse>) => {
    try {
        const treeResult = await pool.query(`
            SELECT skill_trees.*, users.display_name AS owner_display_name
            FROM skill_trees
            JOIN users ON users.id = skill_trees.user_id
            WHERE skill_trees.id = $1`,
            [req.params.id]
        );

        // Make sure the tree exists to begin with
        if(treeResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        
        // Make sure the tree is owned by the user or is public
        const tree = treeResult.rows[0];
        const isOwner = req.userId === tree.user_id;
        if (!tree.is_public && !isOwner) return res.status(404).json({ error: 'Not found' });

        // Grab skills associated with this tree
        const skillsResult = await pool.query('SELECT * FROM skills WHERE tree_id = $1 ORDER BY id ASC', [req.params.id]);
        const skillIDs = skillsResult.rows.map((s: Skill) => s.id);

        // Grab edges associated with skills in this tree
        const edgesResult = skillIDs.length
        ? await pool.query('SELECT * FROM skill_edges WHERE from_skill_id = ANY($1)', [skillIDs]) // If there are skills associated with the tree...
        : { rows: [] }; // If there were no skills associated with the tree, just return an empty array

        // Only the statuses actually referenced by this tree's skills — scoped to the tree, not the viewer,
        // so a logged-out visitor sees the same labels the owner assigned
        const statusIDs = [...new Set(skillsResult.rows.map((s: Skill) => s.status_id).filter((id): id is number => id !== null))];
        const statusesResult = statusIDs.length
        ? await pool.query('SELECT * FROM statuses WHERE id = ANY($1)', [statusIDs])
        : { rows: [] };

        res.json({... tree, skills: skillsResult.rows, edges: edgesResult.rows, statuses: statusesResult.rows});
    }
    catch (err) {
        console.error(err); // Log what actually broke

        // Check for invalid id parameter
        if (isPgError(err) && err.code === '22P02') return res.status(400).json({ error: 'Invalid input' });

        res.status(500).json({ error: 'Database error' });
    }
});

interface CreateTreeBody {
    title: string;
    description?: string;
    is_public?: boolean;
}

router.post('/', requireAuth, async(req: Request<{}, {}, CreateTreeBody>, res: Response<SkillTree | ErrorResponse>) => {
    try {
        const { title, description, is_public } = req.body;

        // title has a character limit; catch it before it hits the DB
        if (title.length > MAX_LENGTHS.treeTitle) return res.status(400).json({ error: `Title must be ${MAX_LENGTHS.treeTitle} characters or fewer` });

        // description has a character limit; catch it before it hits the DB
        if (description && description.length > MAX_LENGTHS.treeDescription) return res.status(400).json({ error: `Description must be ${MAX_LENGTHS.treeDescription} characters or fewer` });

        // Make sure required parameters are passed
        if (!title) return res.status(400).json({ error: 'Title is required' });

        const result = await pool.query(
            'INSERT INTO skill_trees (user_id, title, description, is_public) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.userId, title, description ?? null, is_public ?? false]
        );

        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error(err); // Log what actually broke

        if (isPgError(err) && err.code === "22001") return res.status(400).json({ error: "One or more fields is too long" });

        res.status(500).json({ error: 'Database error' });
    }
});

interface UpdateTreeBody {
    title?: string;
    description?: string;
    is_public?: boolean;
}

router.put('/:id', requireAuth, async(req: Request<{ id: string }, {}, UpdateTreeBody>, res: Response<SkillTree | ErrorResponse>) => {
    try {
        const { title, description, is_public } = req.body;

        // title has a character limit; catch it before it hits the DB
        if (title && title.length > MAX_LENGTHS.treeTitle) return res.status(400).json({ error: `Title must be ${MAX_LENGTHS.treeTitle} characters or fewer` });

        // description has a character limit; catch it before it hits the DB
        if (description && description.length > MAX_LENGTHS.treeDescription) return res.status(400).json({ error: `Description must be ${MAX_LENGTHS.treeDescription} characters or fewer` });

        const result = await pool.query(
            'UPDATE skill_trees SET title = COALESCE($1, title), description = COALESCE($2, description), is_public = COALESCE($3, is_public) WHERE id = $4 AND user_id = $5 RETURNING *',
            [title, description, is_public, req.params.id, req.userId]
        );

        // Check that the PUT was successful
        if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err); // Log what actually broke

        // Check for invalid id parameter
        if (isPgError(err) && err.code === '22P02') return res.status(400).json({ error: 'Invalid input' });

        if (isPgError(err) && err.code === "22001") return res.status(400).json({ error: "One or more fields is too long" });

        res.status(500).json({ error: 'Database error' });
    }
});

router.delete('/:id', requireAuth, async(req: Request<{ id: string }>, res: Response<ErrorResponse>) => {
    try {
        const result = await pool.query(
            'DELETE FROM skill_trees WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, req.userId]
        );

        // Check that DELETE was successful
        if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        
        res.status(204).send();
    }
    catch (err) {
        console.error(err); // Log what actually broke

        // Check for invalid id parameter
        if (isPgError(err) && err.code === '22P02') return res.status(400).json({ error: 'Invalid input' });

        res.status(500).json({ error: 'Database error' });
    }
});

export default router;
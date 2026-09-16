import { Router, Request, Response } from 'express';
import { Skill, SkillTree, TreeWithDetails, ErrorResponse } from '../../shared/types';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { isPgError } from '../utils/utils';
import { MAX_LENGTHS } from '../../shared/constants';
import { generateSlug } from '../utils/slug';

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

router.get('/:slug', optionalAuth, async(req: Request<{ slug: string }>, res: Response<TreeWithDetails | ErrorResponse>) => {
    try {
        const treeResult = await pool.query(
            `SELECT
                t.*,
                u.display_name AS owner_display_name,
                COALESCE(
                    (SELECT json_agg(s.* ORDER BY s.id ASC) FROM skills s WHERE s.tree_id = t.id),
                    '[]'
                ) AS skills,
                COALESCE(
                    (SELECT json_agg(e.*) FROM skill_edges e
                     WHERE e.from_skill_id IN (SELECT id FROM skills WHERE tree_id = t.id)),
                    '[]'
                ) AS edges,
                COALESCE(
                    (SELECT json_agg(st.*) FROM statuses st
                     WHERE st.id IN (
                         SELECT DISTINCT status_id FROM skills
                         WHERE tree_id = t.id AND status_id IS NOT NULL
                     )),
                    '[]'
                ) AS statuses
             FROM skill_trees t
             JOIN users u ON u.id = t.user_id
             WHERE t.slug = $1`,
            [req.params.slug]
        );
        
        // Make sure the tree exists to begin with
        if(treeResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        const tree = treeResult.rows[0];

        // Make sure the tree is owned by the user or is public
        const isOwner = req.userId === tree.user_id;
        if (!tree.is_public && !isOwner) return res.status(404).json({ error: 'Not found' });

        res.json(tree);
    }
    catch (err) {
        console.error(err); // Log what actually broke
        // We don't need to check for any strict integer types here, because slug is a VARCHAR and not an INTEGER
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

        // Retry loop guards against the near-impossible case of a slug collision
        let result;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                result = await pool.query(
                    'INSERT INTO skill_trees (user_id, title, description, is_public, slug) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                    [req.userId, title, description ?? null, is_public ?? false, generateSlug()]
                );
                break;
            } catch (err) {
                if (isPgError(err) && err.code === '23505' && attempt < 2) continue; // unique violation — try a new slug
                throw err;
            }
        }

        res.status(201).json(result!.rows[0]);
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

        // Whenever a request explicitly flips the tree to private, mint a fresh slug.
        // This invalidates any previously shared link — if the tree is made public
        // again later, it gets a brand-new URL rather than reviving the old one.
        const rotateSlug = is_public === false;


        const result = await pool.query(
            `UPDATE skill_trees
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 is_public = COALESCE($3, is_public),
                 slug = CASE WHEN $6 THEN $7 ELSE slug END
             WHERE id = $4 AND user_id = $5 RETURNING *`,
            [title, description, is_public, req.params.id, req.userId, rotateSlug, generateSlug()]
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
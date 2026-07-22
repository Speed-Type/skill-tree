import { Router, Request, Response } from 'express';
import { Skill, ErrorResponse } from '../../shared/types';

import pool from '../db';

const router = Router();

router.get('/', async(req: Request, res: Response<Skill[] | ErrorResponse>) => {
    try {
        const result = await pool.query("SELECT * FROM skills");
        res.json(result.rows);
    }
    catch (err) {
        console.error(err); // Log what actually broke
        res.status(500).json({ error: 'Database error' }); // Client gets a response
    }
});

router.get('/:id', async(req: Request<{ id: string }>, res: Response<Skill | ErrorResponse>) => {
    try {
        const result = await pool.query("SELECT * FROM skills WHERE id = $1", [req.params.id]);

        // Make sure the skill exists to begin with
        if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

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

router.post('/', async(req: Request<{}, {}, CreateSkillBody>, res: Response<Skill | ErrorResponse>) => {
    try {
        const { tree_id, label, description, status_id, x_position, y_position } = req.body;

        // Make sure required parameters are passed
        if (!tree_id || !label) return res.status(400).json({ error: 'Tree id and label are required' });

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

router.put('/:id', async(req: Request<{ id: string }, {}, UpdateSkillBody>, res: Response<Skill | ErrorResponse>) => {
    try {
        const { label, description, status_id, x_position, y_position } = req.body;

        const result = await pool.query(
            'UPDATE skills SET label = COALESCE($1, label), description = COALESCE($2, description), status_id = COALESCE($3, status_id), ' +
            'x_position = COALESCE($4, x_position), y_position = COALESCE($5, y_position) WHERE id = $6 RETURNING *',
            [label, description, status_id, x_position, y_position, req.params.id]
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

router.put('/:id/status', async(req: Request<{ id: string}, {}, { status_id: number}>, res: Response<Skill | ErrorResponse>) => {
    try {
        const { status_id } = req.body;

        const result = await pool.query('UPDATE skills SET status_id = $1 WHERE id = $2 RETURNING *', [status_id, req.params.id]);

        // Check that the PUT was successful
        if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err); // Log what actually broke
        res.status(500).json({ error: 'Database error' }); // Client gets a response
    }
});

router.put('/:id/position', async(req: Request<{ id: string }, {}, { x_position?: number, y_position?: number }>, res: Response<Skill | ErrorResponse>) => {
    try {
        const { x_position, y_position } = req.body;

        const result = await pool.query(
            'UPDATE skills SET x_position = COALESCE($1, x_position), y_position = COALESCE($2, y_position) WHERE id = $3 RETURNING *',
            [x_position, y_position, req.params.id]
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

router.delete('/:id', async(req: Request<{ id: string }>, res: Response<ErrorResponse>) => {
    try {
        const result = await pool.query('DELETE FROM skills WHERE id = $1 RETURNING id', [req.params.id]);

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
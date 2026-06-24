const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async(req, res) => {
    const result = await pool.query("SELECT * FROM skills");
    res.json(result.rows);
});

router.get('/:id', async(req, res) => {
    const result = await pool.query("SELECT * FROM skills WHERE id = $1", [req.params.id]);

    // Make sure the skill exists to begin with
    if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    res.json(result.rows[0]);
});

router.post('/', async(req, res) => {
    const { tree_id, label, description, status_id, x_position, y_position } = req.body;

    // Make sure required parameters are passed
    if (!tree_id || !label) return res.status(400).json({ error: 'Tree id and label are required' });

    const result = await pool.query(
        'INSERT INTO skills (tree_id, label, description, status_id, x_position, y_position) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [tree_id, label, description ?? null, status_id ?? null, x_position ?? 0, y_position ?? 0]
    );

    res.status(201).json(result.rows[0]);
});

router.put('/:id', async(req, res) => {
    const { label, description, status_id, x_position, y_position } = req.body;

    const result = await pool.query(
        'UPDATE skills SET label = COALESCE($1, label), description = COALESCE($2, description), status_id = COALESCE($3, status_id), ' +
        'x_position = COALESCE($4, x_position), y_position = COALESCE($5, y_position) WHERE id = $6 RETURNING *',
        [label, description, status_id, x_position, y_position, req.params.id]
    );

    // Check that the PUT was successful
    if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    res.json(result.rows[0]);
});

router.put('/:id/status', async(req, res) => {
    const { status_id } = req.body;

    const result = await pool.query('UPDATE skills SET status_id = $1 WHERE id = $2 RETURNING *', [status_id, req.params.id]);

    // Check that the PUT was successful
    if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    res.json(result.rows[0]);
});

router.put('/:id/position', async(req, res) => {
    const { x_position, y_position } = req.body;

    const result = await pool.query('UPDATE skills SET x_position = COALESCE($1, x_position), y_position = COALESCE($2, y_position) WHERE id = $3 RETURNING *', [x_position, y_position, req.params.id]);

    // Check that the PUT was successful
    if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    res.json(result.rows[0]);
});

router.delete('/:id', async(req, res) => {
    const result = await pool.query('DELETE FROM skills WHERE id = $1 RETURNING id', [req.params.id]);

    // Check that DELETE was successful
    if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    
    res.status(204).send();
});

module.exports = router;
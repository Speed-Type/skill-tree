const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM statuses');
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

router.get('/:id', async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM statuses WHERE id = $1 ORDER BY sort_order', [req.params.id]);

        // Make sure the status exists to begin with
        if(result.rows.length === 0) return res.status(404).json({ error: "Not found" });

        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

router.post('/', async(req, res) => {
    try {
        const { user_id, label, sort_order } = req.body;

        // Make sure required parameters (email and password) are passed
        if (!user_id || !label) return res.status(400).json({ error: "User id and label are required" });

        const result = await pool.query('INSERT INTO statuses (user_id, label, sort_order) VALUES ($1, $2, $3) RETURNING *', [user_id, label, sort_order ?? 0]);

        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

router.put('/:id', async(req, res) => {
    try {
        const { label, sort_order } = req.body;

        const result = await pool.query(
            'UPDATE statuses SET label = COALESCE($1, label), sort_order = COALESCE($2, sort_order) WHERE id = $3 RETURNING *',
            [label, sort_order ?? 0, req.params.id]
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

router.delete('/:id', async(req, res) => {
    try {
        const result = await pool.query('DELETE FROM statuses WHERE id = $1 RETURNING id', [req.params.id]);

        // Check that DELETE was successful
        if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        res.status(204).send();
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

module.exports = router;
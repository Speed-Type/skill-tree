const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM skill_edges');
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

router.get('/:id', async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM skill_edges WHERE id = $1', [req.params.id]);

        // Make sure the skill edge exists to begin with
        if(result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

router.post('/', async(req, res) => {
    try {
        const { from_skill_id, to_skill_id } = req.body;

        // Make sure required parameters (email and password) are passed
        if (!from_skill_id || !to_skill_id) return res.status(400).json({ error: "To/from skill id's are required" });

        // Make sure a skill edge does not point both to and from itself
        if (from_skill_id === to_skill_id) return res.status(409).json({ error: "A skill cannot point to itself"});

        const result = await pool.query('INSERT INTO skill_edges (from_skill_id, to_skill_id) VALUES ($1, $2) RETURNING *', [from_skill_id, to_skill_id]);

        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        // First check if it's a duplicate edge violation
        if (err.code === "23505") return res.status(409).json({ error: "This edge already exists" });

        console.error(err); // Log what actually broke
        res.status(500).json({ error: 'Database error' }); // Client gets a response
    }
});

router.delete('/:id', async(req, res) => {
    try {
        const result = await pool.query('DELETE FROM skill_edges WHERE id = $1 RETURNING id', [req.params.id]);

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
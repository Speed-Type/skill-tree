const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM skill_trees');
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

router.get('/:id', async(req, res) => {
    try {
        const treeResult = await pool.query('SELECT * FROM skill_trees WHERE id = $1', [req.params.id]);

        // Make sure the tree exists to begin with
        if(treeResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        // Grab skills associated with this tree
        const skillsResult = await pool.query('SELECT * FROM skills WHERE tree_id = $1', [req.params.id]);
        const skillIDs = skillsResult.rows.map(s => s.id);

        // Grab edges associated with skills in this tree
        const edgesResult = skillIDs.length
        ? await pool.query('SELECT * FROM skill_edges WHERE from_skill_id = ANY($1)', [skillIDs]) // If there are skills associated with the tree...
        : { rows: [] }; // If there were no skills associated with the tree, just return an empty array

        res.json({... treeResult.rows[0], skills: skillsResult.rows, edges: edgesResult.rows });
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

router.post('/', async(req, res) => {
    try {
        const { user_id, title, description, is_public } = req.body;

        // Make sure required parameters are passed
        if (!user_id || !title) return res.status(400).json({ error: 'User id and title are required' });

        const result = await pool.query(
            'INSERT INTO skill_trees (user_id, title, description, is_public) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id, title, description ?? null, is_public ?? false]
        );

        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error(err);  // Log what actually broke
        res.status(500).json({ error: 'Database error' });  // Client gets a response
    }
});

router.put('/:id', async(req, res) => {
    try {
        const { title, description, is_public } = req.body;

        const result = await pool.query(
            'UPDATE skill_trees SET title = COALESCE($1, title), description = COALESCE($2, description), is_public = COALESCE($3, is_public) WHERE id = $4 RETURNING *',
            [title, description, is_public, req.params.id]
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
        const result = await pool.query('DELETE FROM skill_trees WHERE id = $1 RETURNING id', [req.params.id]);

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
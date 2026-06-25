const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
	const result = await pool.query('SELECT id, email, created_at FROM users');
	res.json(result.rows);
});

router.get('/:id', async (req, res) => {
	const result = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [req.params.id]);
	if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
	res.json(result.rows[0]);
});

const bcrypt = require('bcrypt'); // Necessary for server-side hashing

router.post('/', async (req, res) => {
	const { email, password } = req.body;

	// Make sure required parameters (email and password) are passed
	if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

	// Encryption
	const password_hash = await bcrypt.hash(password, 10);

	const result = await pool.query(
		'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
		[email, password_hash]
	);
	res.status(201).json(result.rows[0]);
});

module.exports = router;
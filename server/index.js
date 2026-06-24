// Create and setup app instance
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

// Router setup
const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

const treesRouter = require('./routes/trees');
app.use('/trees', treesRouter);

const skillsRouter = require('./routes/skills');
app.use('/skills', skillsRouter);

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
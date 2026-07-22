import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users';
import treesRouter from './routes/trees';
import skillsRouter from './routes/skills';
import skillEdgesRouter from './routes/edges';
import statusesRouter from './routes/statuses';

const app = express();
app.use(express.json());
app.use(cors());

app.use('/users', usersRouter);
app.use('/trees', treesRouter);
app.use('/skills', skillsRouter);
app.use('/edges', skillEdgesRouter);
app.use('/statuses', statusesRouter);

// Start the server
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
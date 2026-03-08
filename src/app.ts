import express from 'express';
import cors from 'cors';
import weatherRouter from './routes/weather';
import todosRouter from './routes/todos';

const app = express();

app.use(express.json());
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/weather', weatherRouter);
app.use('/api/todos', todosRouter);

export default app;

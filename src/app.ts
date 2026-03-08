import express from 'express';
import cors from 'cors';
import weatherRouter from './routes/weather';
import notificationsRouter from './routes/notifications';

const app = express();

app.use(express.json());
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/weather', weatherRouter);
app.use('/api/notifications', notificationsRouter);

export default app;

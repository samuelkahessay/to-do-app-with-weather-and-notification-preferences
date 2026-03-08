import { Router, Request, Response } from 'express';
import { fetchWeather } from '../services/weatherService';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { lat, lon } = req.query;

  const latNum = Number(lat);
  const lonNum = Number(lon);

  if (lat === undefined || lon === undefined || isNaN(latNum) || isNaN(lonNum)) {
    res.status(400).json({ error: 'lat and lon are required and must be numbers' });
    return;
  }

  try {
    const weather = await fetchWeather(latNum, lonNum);
    res.status(200).json(weather);
  } catch {
    res.status(502).json({ error: 'Weather service unavailable' });
  }
});

export default router;

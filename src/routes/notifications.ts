import { Router, Request, Response } from 'express';
import * as notificationStore from '../store/notificationStore';

const router = Router();

// POST /api/notifications/batch — must be registered before /:id
router.post('/batch', (req: Request, res: Response) => {
  const body = req.body;
  if (!Array.isArray(body)) {
    res.status(400).json({ error: 'Request body must be an array' });
    return;
  }
  const result = notificationStore.batchUpdate(body as { id: string; enabled: boolean }[]);
  res.status(200).json(result);
});

// POST /api/notifications
router.post('/', (req: Request, res: Response) => {
  const { userId, channel } = req.body ?? {};
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  if (!channel) {
    res.status(400).json({ error: 'channel is required' });
    return;
  }
  const pref = notificationStore.create({ userId, channel });
  res.status(201).json(pref);
});

// GET /api/notifications
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json(notificationStore.findAll());
});

// GET /api/notifications/:id
router.get('/:id', (req: Request, res: Response) => {
  const pref = notificationStore.findById(req.params.id);
  if (!pref) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(200).json(pref);
});

// PUT /api/notifications/:id
router.put('/:id', (req: Request, res: Response) => {
  const { channel, enabled } = req.body ?? {};
  const patch: Partial<Pick<import('../store/notificationStore').NotificationPreference, 'channel' | 'enabled'>> = {};
  if (channel !== undefined) patch.channel = channel;
  if (enabled !== undefined) patch.enabled = enabled;
  const updated = notificationStore.update(req.params.id, patch);
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(200).json(updated);
});

// DELETE /api/notifications/:id
router.delete('/:id', (req: Request, res: Response) => {
  const removed = notificationStore.remove(req.params.id);
  if (!removed) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(204).send();
});

export default router;

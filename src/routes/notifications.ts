import { Router } from 'express';
import * as notificationStore from '../store/notificationStore';

const router = Router();

// POST /batch must be registered BEFORE /:id to avoid Express treating "batch" as a dynamic segment
router.post('/batch', (req, res) => {
  const items = req.body as unknown;
  if (!Array.isArray(items)) {
    res.status(400).json({ error: 'Body must be an array of { id, enabled } objects' });
    return;
  }
  const result = notificationStore.batchUpdate(items as { id: string; enabled: boolean }[]);
  res.json(result);
});

router.post('/', (req, res) => {
  const { userId, channel } = req.body as Record<string, unknown>;
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  if (!channel || typeof channel !== 'string') {
    res.status(400).json({ error: 'channel is required' });
    return;
  }
  const pref = notificationStore.create({ userId, channel });
  res.status(201).json(pref);
});

router.get('/', (_req, res) => {
  res.json(notificationStore.findAll());
});

router.get('/:id', (req, res) => {
  const pref = notificationStore.findById(req.params.id);
  if (!pref) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(pref);
});

router.put('/:id', (req, res) => {
  const { channel, enabled } = req.body as Record<string, unknown>;
  const patch: Partial<Pick<import('../store/notificationStore').NotificationPreference, 'channel' | 'enabled'>> = {};
  if (typeof channel === 'string') patch.channel = channel;
  if (typeof enabled === 'boolean') patch.enabled = enabled;
  const updated = notificationStore.update(req.params.id, patch);
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const removed = notificationStore.remove(req.params.id);
  if (!removed) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(204).send();
});

export default router;

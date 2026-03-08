import { Router } from 'express';
import * as todoStore from '../store/todoStore';

const router = Router();

router.post('/', (req, res) => {
  const { title } = req.body as Record<string, unknown>;
  if (!title || typeof title !== 'string') {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  const item = todoStore.create(title);
  res.status(201).json(item);
});

router.get('/', (_req, res) => {
  res.json(todoStore.findAll());
});

router.get('/:id', (req, res) => {
  const item = todoStore.findById(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(item);
});

router.put('/:id', (req, res) => {
  const { title, completed } = req.body as Record<string, unknown>;
  const patch: Partial<Pick<todoStore.TodoItem, 'title' | 'completed'>> = {};
  if (typeof title === 'string') patch.title = title;
  if (typeof completed === 'boolean') patch.completed = completed;
  const updated = todoStore.update(req.params.id, patch);
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const removed = todoStore.remove(req.params.id);
  if (!removed) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(204).send();
});

export default router;

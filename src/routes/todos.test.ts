import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { _reset } from '../store/todoStore';

beforeEach(() => {
  _reset();
});

describe('POST /api/todos', () => {
  it('returns 201 with created item', async () => {
    const res = await request(app).post('/api/todos').send({ title: 'Buy milk' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Buy milk', completed: false });
    expect(typeof res.body.id).toBe('string');
    expect(typeof res.body.createdAt).toBe('string');
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/api/todos').send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title is required' });
  });

  it('ignores unknown fields', async () => {
    const res = await request(app).post('/api/todos').send({ title: 'Task', extra: 'ignored' });
    expect(res.status).toBe(201);
    expect(res.body.extra).toBeUndefined();
  });
});

describe('GET /api/todos', () => {
  it('returns 200 with empty array initially', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all created items', async () => {
    await request(app).post('/api/todos').send({ title: 'Task 1' });
    await request(app).post('/api/todos').send({ title: 'Task 2' });
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('GET /api/todos/:id', () => {
  it('returns 200 with matching item', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Find me' });
    const res = await request(app).get(`/api/todos/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Find me');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/todos/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});

describe('PUT /api/todos/:id', () => {
  it('returns 200 with updated item', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Old title' });
    const res = await request(app).put(`/api/todos/${created.body.id}`).send({ title: 'New title', completed: true });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New title');
    expect(res.body.completed).toBe(true);
  });

  it('accepts partial updates', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Task' });
    const res = await request(app).put(`/api/todos/${created.body.id}`).send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
    expect(res.body.title).toBe('Task');
  });

  it('ignores unknown fields', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Task' });
    const res = await request(app).put(`/api/todos/${created.body.id}`).send({ completed: true, unknown: 'x' });
    expect(res.status).toBe(200);
    expect(res.body.unknown).toBeUndefined();
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).put('/api/todos/nonexistent').send({ title: 'x' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});

describe('DELETE /api/todos/:id', () => {
  it('returns 204 for valid id', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Delete me' });
    const res = await request(app).delete(`/api/todos/${created.body.id}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/todos/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});

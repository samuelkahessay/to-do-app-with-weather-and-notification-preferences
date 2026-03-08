import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { _reset } from '../store/notificationStore';

beforeEach(() => {
  _reset();
});

describe('POST /api/notifications', () => {
  it('creates a preference and returns 201', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    expect(res.status).toBe(201);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toMatchObject({ userId: 'u1', channel: 'web', enabled: true });
    expect(res.body.id).toBeDefined();
  });

  it('returns 400 when userId is missing', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ channel: 'web' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/userId/i);
  });

  it('returns 400 when channel is missing', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/channel/i);
  });

  it('accepts channel: "web" as valid', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    expect(res.status).toBe(201);
    expect(res.body.channel).toBe('web');
  });

  it('silently ignores unknown fields in request body', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web', unknown: 'field' });
    expect(res.status).toBe(201);
    expect(res.body.unknown).toBeUndefined();
  });
});

describe('GET /api/notifications', () => {
  it('returns 200 with empty array when no preferences', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual([]);
  });

  it('returns all created preferences', async () => {
    await request(app).post('/api/notifications').send({ userId: 'u1', channel: 'web' });
    await request(app).post('/api/notifications').send({ userId: 'u2', channel: 'email' });
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('GET /api/notifications/:id', () => {
  it('returns 200 with the matching record', async () => {
    const create = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    const id = create.body.id as string;
    const res = await request(app).get(`/api/notifications/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/notifications/nonexistent-id');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/notifications/:id', () => {
  it('updates channel and returns 200', async () => {
    const create = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    const id = create.body.id as string;
    const res = await request(app)
      .put(`/api/notifications/${id}`)
      .send({ channel: 'email' });
    expect(res.status).toBe(200);
    expect(res.body.channel).toBe('email');
  });

  it('updates enabled and returns 200', async () => {
    const create = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    const id = create.body.id as string;
    const res = await request(app)
      .put(`/api/notifications/${id}`)
      .send({ enabled: false });
    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(false);
  });

  it('silently ignores unknown fields', async () => {
    const create = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    const id = create.body.id as string;
    const res = await request(app)
      .put(`/api/notifications/${id}`)
      .send({ channel: 'email', unknown: 'value' });
    expect(res.status).toBe(200);
    expect(res.body.unknown).toBeUndefined();
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app)
      .put('/api/notifications/nonexistent-id')
      .send({ enabled: false });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/notifications/:id', () => {
  it('returns 204 when deleting an existing preference', async () => {
    const create = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    const id = create.body.id as string;
    const res = await request(app).delete(`/api/notifications/${id}`);
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).delete('/api/notifications/nonexistent-id');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/notifications/batch', () => {
  it('updates all matching preferences and returns 200 with updated + skipped', async () => {
    const c1 = await request(app).post('/api/notifications').send({ userId: 'u1', channel: 'web' });
    const c2 = await request(app).post('/api/notifications').send({ userId: 'u2', channel: 'email' });
    const id1 = c1.body.id as string;
    const id2 = c2.body.id as string;
    const res = await request(app)
      .post('/api/notifications/batch')
      .send([{ id: id1, enabled: false }, { id: id2, enabled: false }]);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.updated).toHaveLength(2);
    expect(res.body.skipped).toHaveLength(0);
  });

  it('skips unknown ids and lists them in skipped', async () => {
    const c1 = await request(app).post('/api/notifications').send({ userId: 'u1', channel: 'web' });
    const id1 = c1.body.id as string;
    const res = await request(app)
      .post('/api/notifications/batch')
      .send([{ id: id1, enabled: false }, { id: 'does-not-exist', enabled: true }]);
    expect(res.status).toBe(200);
    expect(res.body.updated).toHaveLength(1);
    expect(res.body.skipped).toContain('does-not-exist');
  });

  it('returns updated:[] and skipped with all ids when none found', async () => {
    const res = await request(app)
      .post('/api/notifications/batch')
      .send([{ id: 'x', enabled: true }, { id: 'y', enabled: false }]);
    expect(res.status).toBe(200);
    expect(res.body.updated).toHaveLength(0);
    expect(res.body.skipped).toEqual(['x', 'y']);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { _reset } from '../store/notificationStore';

beforeEach(() => {
  _reset();
});

describe('POST /api/notifications', () => {
  it('returns 201 with created preference', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ userId: 'user1', channel: 'web' });
    expect(res.status).toBe(201);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toMatchObject({
      userId: 'user1',
      channel: 'web',
      enabled: true,
    });
    expect(typeof res.body.id).toBe('string');
    expect(typeof res.body.updatedAt).toBe('string');
  });

  it('accepts channel "web" as valid', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ userId: 'user2', channel: 'web' });
    expect(res.status).toBe(201);
    expect(res.body.channel).toBe('web');
  });

  it('returns 400 when userId is missing', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ channel: 'web' });
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.error).toMatch(/userId/i);
  });

  it('returns 400 when channel is missing', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ userId: 'user1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/channel/i);
  });

  it('ignores unknown fields without crashing', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ userId: 'user1', channel: 'web', unknownField: 'value' });
    expect(res.status).toBe(201);
  });
});

describe('GET /api/notifications', () => {
  it('returns 200 with empty array initially', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual([]);
  });

  it('returns all created preferences', async () => {
    await request(app).post('/api/notifications').send({ userId: 'u1', channel: 'web' });
    await request(app).post('/api/notifications').send({ userId: 'u2', channel: 'web' });
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('GET /api/notifications/:id', () => {
  it('returns 200 with matching preference', async () => {
    const create = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    const { id } = create.body;
    const res = await request(app).get(`/api/notifications/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/notifications/unknown-id');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/notifications/:id', () => {
  it('updates channel and enabled, returns 200', async () => {
    const create = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    const { id } = create.body;
    const res = await request(app)
      .put(`/api/notifications/${id}`)
      .send({ enabled: false });
    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(false);
  });

  it('ignores unknown fields silently', async () => {
    const create = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    const { id } = create.body;
    const res = await request(app)
      .put(`/api/notifications/${id}`)
      .send({ enabled: false, randomField: 'x' });
    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .put('/api/notifications/unknown-id')
      .send({ enabled: false });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/notifications/:id', () => {
  it('returns 204 when preference is deleted', async () => {
    const create = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    const { id } = create.body;
    const res = await request(app).delete(`/api/notifications/${id}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/notifications/unknown-id');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/notifications/batch', () => {
  it('updates matching records and skips unknown ids', async () => {
    const c1 = await request(app).post('/api/notifications').send({ userId: 'u1', channel: 'web' });
    const c2 = await request(app).post('/api/notifications').send({ userId: 'u2', channel: 'web' });
    const res = await request(app)
      .post('/api/notifications/batch')
      .send([
        { id: c1.body.id, enabled: false },
        { id: c2.body.id, enabled: false },
        { id: 'nonexistent-id', enabled: false },
      ]);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.updated).toHaveLength(2);
    expect(res.body.skipped).toEqual(['nonexistent-id']);
    expect(res.body.updated.every((p: { enabled: boolean }) => p.enabled === false)).toBe(true);
  });

  it('returns updated and empty skipped when all ids match', async () => {
    const c1 = await request(app).post('/api/notifications').send({ userId: 'u1', channel: 'web' });
    const res = await request(app)
      .post('/api/notifications/batch')
      .send([{ id: c1.body.id, enabled: false }]);
    expect(res.status).toBe(200);
    expect(res.body.updated).toHaveLength(1);
    expect(res.body.skipped).toEqual([]);
  });
});

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
    expect(res.body).toMatchObject({ userId: 'user1', channel: 'web', enabled: true });
    expect(typeof res.body.id).toBe('string');
    expect(typeof res.body.updatedAt).toBe('string');
  });

  it('accepts channel: "web" as valid', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    expect(res.status).toBe(201);
    expect(res.body.channel).toBe('web');
  });

  it('returns 400 when userId is missing', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ channel: 'web' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/userId/);
  });

  it('returns 400 when channel is missing', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/channel/);
  });

  it('ignores unknown fields', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web', extra: 'x' });
    expect(res.status).toBe(201);
    expect(res.body.extra).toBeUndefined();
  });
});

describe('GET /api/notifications', () => {
  it('returns 200 with empty array initially', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(200);
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
    const created = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    const res = await request(app).get(`/api/notifications/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('u1');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/notifications/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/notifications/:id', () => {
  it('returns 200 with updated preference', async () => {
    const created = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    const res = await request(app)
      .put(`/api/notifications/${created.body.id}`)
      .send({ enabled: false });
    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(false);
  });

  it('accepts partial update of channel', async () => {
    const created = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    const res = await request(app)
      .put(`/api/notifications/${created.body.id}`)
      .send({ channel: 'email' });
    expect(res.status).toBe(200);
    expect(res.body.channel).toBe('email');
    expect(res.body.userId).toBe('u1');
  });

  it('ignores unknown fields', async () => {
    const created = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    const res = await request(app)
      .put(`/api/notifications/${created.body.id}`)
      .send({ enabled: false, unknown: 'x' });
    expect(res.status).toBe(200);
    expect(res.body.unknown).toBeUndefined();
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).put('/api/notifications/nonexistent').send({ enabled: false });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/notifications/:id', () => {
  it('returns 204 for valid id', async () => {
    const created = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    const res = await request(app).delete(`/api/notifications/${created.body.id}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/notifications/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/notifications/batch', () => {
  it('returns 200 with updated and skipped arrays', async () => {
    const p1 = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', channel: 'web' });
    const p2 = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u2', channel: 'web' });

    const res = await request(app)
      .post('/api/notifications/batch')
      .send([
        { id: p1.body.id, enabled: false },
        { id: p2.body.id, enabled: false },
        { id: 'unknown-id', enabled: false },
      ]);
    expect(res.status).toBe(200);
    expect(res.body.updated).toHaveLength(2);
    expect(res.body.skipped).toEqual(['unknown-id']);
  });

  it('handles all unknown ids (all skipped)', async () => {
    const res = await request(app)
      .post('/api/notifications/batch')
      .send([{ id: 'x', enabled: false }, { id: 'y', enabled: true }]);
    expect(res.status).toBe(200);
    expect(res.body.updated).toHaveLength(0);
    expect(res.body.skipped).toHaveLength(2);
  });

  it('handles empty array', async () => {
    const res = await request(app).post('/api/notifications/batch').send([]);
    expect(res.status).toBe(200);
    expect(res.body.updated).toHaveLength(0);
    expect(res.body.skipped).toHaveLength(0);
  });
});

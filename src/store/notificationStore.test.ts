import { describe, it, expect, beforeEach } from 'vitest';
import * as notificationStore from './notificationStore';

beforeEach(() => {
  notificationStore._reset();
});

describe('notificationStore', () => {
  it('create returns a NotificationPreference with correct fields', () => {
    const pref = notificationStore.create({ userId: 'u1', channel: 'web' });
    expect(pref.id).toBeTruthy();
    expect(pref.userId).toBe('u1');
    expect(pref.channel).toBe('web');
    expect(pref.enabled).toBe(true);
    expect(pref.updatedAt).toBeTruthy();
  });

  it('create generates unique IDs', () => {
    const a = notificationStore.create({ userId: 'u1', channel: 'email' });
    const b = notificationStore.create({ userId: 'u2', channel: 'web' });
    expect(a.id).not.toBe(b.id);
  });

  it('findAll returns all created preferences', () => {
    notificationStore.create({ userId: 'u1', channel: 'web' });
    notificationStore.create({ userId: 'u2', channel: 'email' });
    expect(notificationStore.findAll()).toHaveLength(2);
  });

  it('findAll returns empty array when store is empty', () => {
    expect(notificationStore.findAll()).toEqual([]);
  });

  it('findById returns the preference for a known id', () => {
    const pref = notificationStore.create({ userId: 'u1', channel: 'web' });
    expect(notificationStore.findById(pref.id)).toEqual(pref);
  });

  it('findById returns undefined for unknown id', () => {
    expect(notificationStore.findById('unknown')).toBeUndefined();
  });

  it('update patches existing preference and sets updatedAt', () => {
    const pref = notificationStore.create({ userId: 'u1', channel: 'web' });
    const updated = notificationStore.update(pref.id, { enabled: false });
    expect(updated).toBeDefined();
    expect(updated!.enabled).toBe(false);
    expect(typeof updated!.updatedAt).toBe('string');
    expect(updated!.updatedAt).toBeTruthy();
  });

  it('update returns undefined for unknown id', () => {
    expect(notificationStore.update('none', { enabled: false })).toBeUndefined();
  });

  it('remove deletes an existing preference and returns true', () => {
    const pref = notificationStore.create({ userId: 'u1', channel: 'web' });
    expect(notificationStore.remove(pref.id)).toBe(true);
    expect(notificationStore.findById(pref.id)).toBeUndefined();
  });

  it('remove returns false for unknown id', () => {
    expect(notificationStore.remove('nope')).toBe(false);
  });

  it('batchUpdate updates matched records and skips unknown ids', () => {
    const a = notificationStore.create({ userId: 'u1', channel: 'web' });
    const b = notificationStore.create({ userId: 'u2', channel: 'email' });
    const result = notificationStore.batchUpdate([
      { id: a.id, enabled: false },
      { id: 'unknown', enabled: false },
      { id: b.id, enabled: false },
    ]);
    expect(result.updated).toHaveLength(2);
    expect(result.updated.every(p => p.enabled === false)).toBe(true);
    expect(result.skipped).toEqual(['unknown']);
  });

  it('batchUpdate with all unknown ids returns empty updated and all in skipped', () => {
    const result = notificationStore.batchUpdate([
      { id: 'x', enabled: false },
      { id: 'y', enabled: false },
    ]);
    expect(result.updated).toHaveLength(0);
    expect(result.skipped).toEqual(['x', 'y']);
  });
});

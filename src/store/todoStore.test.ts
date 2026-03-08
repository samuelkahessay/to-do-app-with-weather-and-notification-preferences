import { describe, it, expect, beforeEach } from 'vitest';
import * as todoStore from './todoStore';

beforeEach(() => {
  todoStore._reset();
});

describe('todoStore', () => {
  it('create returns a TodoItem with correct fields', () => {
    const item = todoStore.create('Buy milk');
    expect(item.id).toBeTruthy();
    expect(item.title).toBe('Buy milk');
    expect(item.completed).toBe(false);
    expect(item.createdAt).toBeTruthy();
  });

  it('create generates unique IDs', () => {
    const a = todoStore.create('A');
    const b = todoStore.create('B');
    expect(a.id).not.toBe(b.id);
  });

  it('findAll returns all created items', () => {
    todoStore.create('Task 1');
    todoStore.create('Task 2');
    expect(todoStore.findAll()).toHaveLength(2);
  });

  it('findAll returns empty array when store is empty', () => {
    expect(todoStore.findAll()).toEqual([]);
  });

  it('findById returns the item for a known id', () => {
    const item = todoStore.create('Test');
    expect(todoStore.findById(item.id)).toEqual(item);
  });

  it('findById returns undefined for unknown id', () => {
    expect(todoStore.findById('unknown')).toBeUndefined();
  });

  it('update patches existing item', () => {
    const item = todoStore.create('Original');
    const updated = todoStore.update(item.id, { title: 'Changed', completed: true });
    expect(updated).toBeDefined();
    expect(updated!.title).toBe('Changed');
    expect(updated!.completed).toBe(true);
    expect(updated!.createdAt).toBe(item.createdAt);
  });

  it('update returns undefined for unknown id', () => {
    expect(todoStore.update('none', { title: 'x' })).toBeUndefined();
  });

  it('remove deletes an existing item and returns true', () => {
    const item = todoStore.create('Delete me');
    expect(todoStore.remove(item.id)).toBe(true);
    expect(todoStore.findById(item.id)).toBeUndefined();
  });

  it('remove returns false for unknown id', () => {
    expect(todoStore.remove('nope')).toBe(false);
  });
});

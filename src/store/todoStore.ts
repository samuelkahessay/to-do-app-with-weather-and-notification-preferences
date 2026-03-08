export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

const store = new Map<string, TodoItem>();

export function create(title: string): TodoItem {
  const item: TodoItem = {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  store.set(item.id, item);
  return item;
}

export function findAll(): TodoItem[] {
  return Array.from(store.values());
}

export function findById(id: string): TodoItem | undefined {
  return store.get(id);
}

export function update(
  id: string,
  patch: Partial<Pick<TodoItem, 'title' | 'completed'>>
): TodoItem | undefined {
  const item = store.get(id);
  if (!item) return undefined;
  const updated = { ...item, ...patch };
  store.set(id, updated);
  return updated;
}

export function remove(id: string): boolean {
  return store.delete(id);
}

// Reset store (used in tests)
export function _reset(): void {
  store.clear();
}

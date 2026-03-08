export interface NotificationPreference {
  id: string;
  userId: string;
  channel: string;
  enabled: boolean;
  updatedAt: string;
}

const store = new Map<string, NotificationPreference>();

export function create(data: { userId: string; channel: string }): NotificationPreference {
  const pref: NotificationPreference = {
    id: crypto.randomUUID(),
    userId: data.userId,
    channel: data.channel,
    enabled: true,
    updatedAt: new Date().toISOString(),
  };
  store.set(pref.id, pref);
  return pref;
}

export function findAll(): NotificationPreference[] {
  return Array.from(store.values());
}

export function findById(id: string): NotificationPreference | undefined {
  return store.get(id);
}

export function update(
  id: string,
  patch: Partial<Pick<NotificationPreference, 'channel' | 'enabled'>>
): NotificationPreference | undefined {
  const pref = store.get(id);
  if (!pref) return undefined;
  const updated = { ...pref, ...patch, updatedAt: new Date().toISOString() };
  store.set(id, updated);
  return updated;
}

export function remove(id: string): boolean {
  return store.delete(id);
}

export function batchUpdate(
  items: { id: string; enabled: boolean }[]
): { updated: NotificationPreference[]; skipped: string[] } {
  const updated: NotificationPreference[] = [];
  const skipped: string[] = [];
  for (const { id, enabled } of items) {
    const result = update(id, { enabled });
    if (result) {
      updated.push(result);
    } else {
      skipped.push(id);
    }
  }
  return { updated, skipped };
}

// Reset store (used in tests)
export function _reset(): void {
  store.clear();
}

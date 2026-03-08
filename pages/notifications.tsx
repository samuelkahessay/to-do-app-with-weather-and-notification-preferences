import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../styles/Notifications.module.css';

interface NotificationPreference {
  id: string;
  userId: string;
  channel: string;
  enabled: boolean;
}

export default function Notifications() {
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrefs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notification preferences');
      const data: NotificationPreference[] = await res.json();
      setPrefs(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefs();
  }, []);

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (!res.ok) throw new Error('Failed to update notification preference');
      await fetchPrefs();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDisableAll = async () => {
    try {
      const updates = prefs.map((p) => ({ id: p.id, enabled: false }));
      const res = await fetch('/api/notifications/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to disable all notifications');
      await fetchPrefs();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Notification Preferences</h1>
      <Link href="/" className={styles.back}>
        ← Back to To-Dos
      </Link>

      <div className={styles.actions}>
        <button className={styles.disableAll} onClick={handleDisableAll}>
          Disable All
        </button>
      </div>

      {loading && <p className={styles.status}>Loading preferences...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && (
        <ul className={styles.list}>
          {prefs.length === 0 && (
            <li className={styles.empty}>No notification preferences found.</li>
          )}
          {prefs.map((pref) => (
            <li key={pref.id} className={styles.item}>
              <span className={styles.prefInfo}>
                {pref.userId} — {pref.channel}
              </span>
              <span
                className={pref.enabled ? styles.enabled : styles.disabled}
              >
                {pref.enabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                className={styles.toggleButton}
                onClick={() => handleToggle(pref.id, pref.enabled)}
              >
                {pref.enabled ? 'Disable' : 'Enable'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
}

interface WeatherData {
  temperature: number;
  description: string;
}

const DEFAULT_LAT = 40.7128;
const DEFAULT_LON = -74.006;

export default function Home() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to fetch todos');
      const data: TodoItem[] = await res.json();
      setTodos(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setWeatherLoading(true);
      setWeatherError(null);
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error('Weather service unavailable');
      const data: WeatherData = await res.json();
      setWeather(data);
    } catch (e) {
      setWeatherError((e as Error).message);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(DEFAULT_LAT, DEFAULT_LON),
      );
    } else {
      fetchWeather(DEFAULT_LAT, DEFAULT_LON);
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) throw new Error('Failed to create todo');
      setNewTitle('');
      await fetchTodos();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });
      if (!res.ok) throw new Error('Failed to update todo');
      await fetchTodos();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete todo');
      await fetchTodos();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>To-Do App</h1>

      <div className={styles.weatherWidget}>
        <h2 className={styles.widgetTitle}>Current Weather</h2>
        {weatherLoading && <p className={styles.status}>Loading weather...</p>}
        {weatherError && (
          <p className={styles.error}>Weather unavailable: {weatherError}</p>
        )}
        {weather && !weatherLoading && (
          <p>
            <strong>{weather.temperature}°C</strong> — {weather.description}
          </p>
        )}
      </div>

      <form onSubmit={handleCreate} className={styles.form}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New to-do title"
          className={styles.input}
          aria-label="New to-do title"
        />
        <button type="submit" className={styles.button}>
          Add
        </button>
      </form>

      {loading && <p className={styles.status}>Loading todos...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && (
        <ul className={styles.list}>
          {todos.map((todo) => (
            <li key={todo.id} className={styles.item}>
              <span className={todo.completed ? styles.completed : styles.title}>
                {todo.title}
              </span>
              <button
                className={styles.actionButton}
                onClick={() => handleToggle(todo.id, todo.completed)}
              >
                {todo.completed ? 'Undo' : 'Complete'}
              </button>
              <button
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={() => handleDelete(todo.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link href="/notifications" className={styles.link}>
        Manage Notifications →
      </Link>
    </div>
  );
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWeather } from './weatherService';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchWeather', () => {
  it('maps Open-Meteo response to WeatherResult correctly', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        current_weather: { temperature: 22.5, weathercode: 0 },
      }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    const result = await fetchWeather(48.85, 2.35);
    expect(result).toEqual({ temperature: 22.5, unit: 'celsius', description: 'Clear' });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('latitude=48.85')
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('longitude=2.35')
    );
  });

  it('maps weathercode 2 to Cloudy', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ current_weather: { temperature: 15, weathercode: 2 } }),
    } as unknown as Response);
    const result = await fetchWeather(0, 0);
    expect(result.description).toBe('Cloudy');
  });

  it('maps weathercode 61 to Rain', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ current_weather: { temperature: 10, weathercode: 61 } }),
    } as unknown as Response);
    const result = await fetchWeather(0, 0);
    expect(result.description).toBe('Rain');
  });

  it('maps weathercode 71 to Snow', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ current_weather: { temperature: -2, weathercode: 71 } }),
    } as unknown as Response);
    const result = await fetchWeather(0, 0);
    expect(result.description).toBe('Snow');
  });

  it('maps weathercode 95 to Thunderstorm', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ current_weather: { temperature: 18, weathercode: 95 } }),
    } as unknown as Response);
    const result = await fetchWeather(0, 0);
    expect(result.description).toBe('Thunderstorm');
  });

  it('throws when fetch rejects (network error)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    await expect(fetchWeather(0, 0)).rejects.toThrow('Weather service unavailable');
  });

  it('throws when response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
    } as unknown as Response);
    await expect(fetchWeather(0, 0)).rejects.toThrow('Weather service unavailable');
  });
});

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

// Minimal mapping of WMO weathercode to description
function describeWeathercode(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Cloudy';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

export interface WeatherResult {
  temperature: number;
  unit: 'celsius';
  description: string;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherResult> {
  const url = `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}&current_weather=true`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('Weather service unavailable');
  }
  if (!response.ok) {
    throw new Error('Weather service unavailable');
  }
  const data = (await response.json()) as {
    current_weather: { temperature: number; weathercode: number };
  };
  const { temperature, weathercode } = data.current_weather;
  return {
    temperature,
    unit: 'celsius',
    description: describeWeathercode(weathercode),
  };
}

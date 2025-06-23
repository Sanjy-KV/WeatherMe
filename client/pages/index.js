import { useState, useEffect } from 'react';
import Head from 'next/head';
import Lottie from 'lottie-react';
import clear from '../public/animations/clear.json';
import rain from '../public/animations/rain.json';
import snow from '../public/animations/snow.json';
import storm from '../public/animations/storm.json';
import cloud from '../public/animations/cloud.json';
import earth from '../public/animations/earth.json';

export default function Home() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getWeather = async () => {
    if (!city) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/weather?city=${city}`);
      if (!res.ok) throw new Error('City not found');
      const data = await res.json();
      setWeather(data);
      setError('');
      fetchForecast(data.coord.lat, data.coord.lon);
    } catch (err) {
      setError('❌ Could not fetch weather for the city.');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherByLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `http://localhost:5000/weather/geo?lat=${latitude}&lon=${longitude}`
          );
          if (!res.ok) throw new Error('Failed to fetch weather by location');
          const data = await res.json();
          setWeather(data);
          setError('');
          fetchForecast(latitude, longitude);
        } catch (err) {
          setError('❌ Could not fetch weather by location.');
          setWeather(null);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('❌ Failed to get your location.');
        setLoading(false);
      }
    );
  };

  const fetchForecast = async (lat, lon) => {
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`);
      const data = await res.json();
      const daily = data.list.filter((_, idx) => idx % 8 === 0);
      setForecast(daily);
    } catch {
      setForecast([]);
    }
  };

  const getDateTime = () => {
    if (!weather) return '';
    const localTime = new Date((weather.dt + weather.timezone - new Date().getTimezoneOffset() * 60) * 1000);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(localTime);
  };

  const getFlagUrl = (code) => `https://flagcdn.com/48x36/${code.toLowerCase()}.png`;

  const getAnimation = () => {
    if (!weather) return null;
    const main = weather.weather[0].main.toLowerCase();
    if (main.includes('rain')) return rain;
    if (main.includes('clear')) return clear;
    if (main.includes('cloud')) return cloud;
    if (main.includes('snow')) return snow;
    if (main.includes('thunderstorm') || main.includes('storm')) return storm;
    return clear;
  };

  const getSuggestions = () => {
    if (!weather) return '';
    const temp = weather.main.temp;
    if (temp < 5) return '🧣 Wear a jacket, it’s cold!';
    if (temp >= 5 && temp <= 25) return '🧥 A light jacket is fine.';
    if (temp > 25) return '🧢 Stay hydrated and wear sunglasses!';
    return '';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      getWeather();
    }
  };

  return (
    <>
      <Head>
        <title> WeatherMe</title>
        <link rel="icon" href="/logo.png" />
      </Head>
      <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white flex items-center justify-center px-4">
        {!weather && (
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <Lottie animationData={earth} loop autoplay className="w-full h-full" />
          </div>
        )}

        {weather && (
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
            <Lottie animationData={getAnimation()} loop autoplay className="w-full h-full" />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md overflow-y-auto max-h-screen py-4">
          <h1 className="text-4xl font-bold mb-4 text-center text-white">🌦️ WeatherMe</h1>

          <input
            type="text"
            placeholder="Enter city name"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={handleKeyPress}
            className="px-5 py-3 rounded bg-[#f7f9f9] text-white text-center placeholder-white w-72 mb-4"
          />
          <br />
          <button
            onClick={getWeatherByLocation}
            className="bg-[#bb8fce] hover:bg-[#5a4ae0] text-white px-4 py-3 w-72 rounded font-semibold transition mb-4"
          >
            📍 Use My Location
          </button>
          <br />
          <button
            onClick={getWeather}
            className="bg-[#8e44ad] hover:bg-[#00b894] text-white px-4 py-3 w-72 rounded font-semibold transition mb-4"
          >
            Get Weather
          </button>

          {loading && <p className="mt-3 animate-pulse text-white">⏳ Fetching weather data...</p>}

          {error && (
            <p className="text-red-200 bg-red-600 px-4 py-2 rounded mt-3 text-center w-72">{error}</p>
          )}

          {weather && (
            <div className="mt-6 bg-white/20 backdrop-blur-sm text-white p-6 rounded-lg shadow-lg text-center w-72">
              <div className="flex items-center justify-center mb-2 gap-2">
                <h2 className="text-2xl font-bold text-white">{weather.name}</h2>
                <img src={getFlagUrl(weather.sys.country)} alt="flag" className="w-6 h-4 rounded shadow" />
              </div>
              <p className="text-sm mb-2 text-white">{getDateTime()}</p>
              <p className="text-lg mt-2 text-white">🌡 Temp: {weather.main.temp} °C</p>
              <p className="capitalize text-white">🌥 {weather.weather[0].description}</p>
              <p className="mt-3 italic text-white">💡 {getSuggestions()}</p>
              <p className="text-sm mt-2 text-white">💧 Humidity: {weather.main.humidity}%</p>
              <p className="text-sm text-white">🌬 Wind: {weather.wind.speed} m/s</p>
            </div>
          )}

          {forecast.length > 0 && (
            <div className="mt-6 w-full max-w-md text-white">
              <h3 className="text-lg font-semibold mb-2">📅 3-Day Forecast</h3>
              <div className="grid grid-cols-1 gap-3">
                {forecast.slice(1, 4).map((f, idx) => (
                  <div key={idx} className="bg-white/10 p-4 rounded-lg text-white">
                    <p className="font-semibold">{new Date(f.dt * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                    <p>🌡 {f.main.temp} °C</p>
                    <p>🌥 {f.weather[0].description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

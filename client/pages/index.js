import { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export default function Home() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [animations, setAnimations] = useState({});

  // Load animations dynamically
  useEffect(() => {
    const loadAnimations = async () => {
      try {
        const [clearAnim, rainAnim, snowAnim, stormAnim, cloudAnim, earthAnim] = await Promise.all([
          fetch('/animations/clear.json').then(res => res.json()).catch(() => null),
          fetch('/animations/rain.json').then(res => res.json()).catch(() => null),
          fetch('/animations/snow.json').then(res => res.json()).catch(() => null),
          fetch('/animations/storm.json').then(res => res.json()).catch(() => null),
          fetch('/animations/cloud.json').then(res => res.json()).catch(() => null),
          fetch('/animations/earth.json').then(res => res.json()).catch(() => null),
        ]);

        setAnimations({
          clear: clearAnim,
          rain: rainAnim,
          snow: snowAnim,
          storm: stormAnim,
          cloud: cloudAnim,
          earth: earthAnim,
        });
      } catch (error) {
        console.log('Animations not loaded, using fallback');
      }
    };

    loadAnimations();
  }, []);

  const getWeather = async () => {
    if (!city.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`https://weatherme-ml05.onrender.com/weather?city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error('City not found');
      const data = await res.json();
      setWeather(data);
      setError('');
      fetchForecast(data.coord.lat, data.coord.lon);
    } catch (err) {
      setError('❌ Could not fetch weather for the city.');
      setWeather(null);
      setForecast([]);
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
    setError('');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://weatherme-ml05.onrender.com/weather/geo?lat=${latitude}&lon=${longitude}`
          );
          if (!res.ok) throw new Error('Failed to fetch weather by location');
          const data = await res.json();
          setWeather(data);
          setError('');
          fetchForecast(latitude, longitude);
        } catch (err) {
          setError('❌ Could not fetch weather by location.');
          setWeather(null);
          setForecast([]);
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
    if (!process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY) {
      console.log('OpenWeather API key not found');
      return;
    }
    
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      );
      if (!res.ok) throw new Error('Forecast fetch failed');
      const data = await res.json();
      const daily = data.list.filter((_, idx) => idx % 8 === 0);
      setForecast(daily);
    } catch (error) {
      console.log('Forecast not available');
      setForecast([]);
    }
  };

  const getDateTime = () => {
    if (!weather) return '';
    try {
      const localTime = new Date((weather.dt + weather.timezone - new Date().getTimezoneOffset() * 60) * 1000);
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'UTC',
      }).format(localTime);
    } catch {
      return new Date().toLocaleDateString();
    }
  };

  const getFlagUrl = (code) => `https://flagcdn.com/48x36/${code.toLowerCase()}.png`;

  const getAnimation = () => {
    if (!weather || !animations) return null;
    const main = weather.weather[0].main.toLowerCase();
    if (main.includes('rain') && animations.rain) return animations.rain;
    if (main.includes('clear') && animations.clear) return animations.clear;
    if (main.includes('cloud') && animations.cloud) return animations.cloud;
    if (main.includes('snow') && animations.snow) return animations.snow;
    if ((main.includes('thunderstorm') || main.includes('storm')) && animations.storm) return animations.storm;
    return animations.clear;
  };

  const getSuggestions = () => {
    if (!weather) return '';
    const temp = weather.main.temp;
    if (temp < 5) return '🧣 Wear a jacket, it\'s cold!';
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
        <title>WeatherMe</title>
        <meta name="description" content="Get weather information for any city" />
        <link rel="icon" href="/logo.png" />
      </Head>
      
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        
        {/* Background Animation */}
        {!weather && animations.earth && (
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <Lottie animationData={animations.earth} loop={true} className="w-full h-full object-cover" />
          </div>
        )}

        {weather && getAnimation() && (
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
            <Lottie animationData={getAnimation()} loop={true} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              🌦️ WeatherMe
            </h1>
            <p className="text-gray-300 text-lg">Get weather information for any city</p>
          </div>

          {/* Input Section */}
          <div className="w-full max-w-md space-y-4 mb-6">
            <input
              type="text"
              placeholder="Enter city name..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full px-6 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={getWeatherByLocation}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95"
              >
                📍 Use My Location
              </button>
              
              <button
                onClick={getWeather}
                disabled={loading || !city.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95"
              >
                🔍 Get Weather
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <p className="text-white animate-pulse">Fetching weather data...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/80 backdrop-blur-sm text-white px-6 py-4 rounded-xl mb-6 text-center max-w-md w-full border border-red-400">
              {error}
            </div>
          )}

          {/* Weather Display */}
          {weather && (
            <div className="bg-white/10 backdrop-blur-md text-white p-8 rounded-2xl shadow-2xl border border-white/20 max-w-md w-full mb-6">
              
              {/* City and Flag */}
              <div className="flex items-center justify-center mb-4 space-x-3">
                <h2 className="text-3xl font-bold">{weather.name}</h2>
                <img 
                  src={getFlagUrl(weather.sys.country)} 
                  alt={`${weather.sys.country} flag`} 
                  className="w-8 h-6 rounded shadow-md"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              
              {/* Date and Time */}
              <p className="text-center text-gray-300 mb-6 text-sm">{getDateTime()}</p>
              
              {/* Main Weather Info */}
              <div className="text-center space-y-3">
                <div className="text-4xl font-bold text-yellow-400">
                  {Math.round(weather.main.temp)}°C
                </div>
                
                <p className="capitalize text-xl text-gray-200">
                  🌥 {weather.weather[0].description}
                </p>
                
                <div className="bg-blue-500/20 rounded-lg p-4 my-4">
                  <p className="text-blue-200 font-medium">{getSuggestions()}</p>
                </div>
                
                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-gray-300">💧 Humidity</p>
                    <p className="font-semibold">{weather.main.humidity}%</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-gray-300">🌬 Wind Speed</p>
                    <p className="font-semibold">{weather.wind.speed} m/s</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-gray-300">👁 Visibility</p>
                    <p className="font-semibold">{weather.visibility ? `${(weather.visibility / 1000).toFixed(1)} km` : 'N/A'}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-gray-300">🌡 Feels Like</p>
                    <p className="font-semibold">{Math.round(weather.main.feels_like)}°C</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forecast */}
          {forecast.length > 0 && (
            <div className="w-full max-w-md">
              <h3 className="text-2xl font-semibold mb-4 text-center">📅 3-Day Forecast</h3>
              <div className="space-y-3">
                {forecast.slice(1, 4).map((f, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-lg">
                        {new Date(f.dt * 1000).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-gray-300 capitalize text-sm">{f.weather[0].description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-400">{Math.round(f.main.temp)}°</p>
                    </div>
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
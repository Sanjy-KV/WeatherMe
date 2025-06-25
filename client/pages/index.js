'use client';

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
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://weatherme-wh4m.onrender.com';

  const testAPIConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  };

  const safeFetch = async (url) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (text.trim().startsWith('<!DOCTYPE')) throw new Error('Received HTML instead of JSON.');
      return JSON.parse(text);
    } catch (error) {
      throw error;
    }
  };

  const getWeather = async () => {
    if (!city) return;
    setLoading(true);
    setError('');
    try {
      const ok = await testAPIConnection();
      if (!ok) throw new Error('Backend API not responding.');
      const data = await safeFetch(`${API_BASE_URL}/weather?city=${encodeURIComponent(city)}`);
      setWeather(data);
      fetchForecast(data.coord.lat, data.coord.lon);
    } catch (err) {
      setError(`❌ ${err.message}`);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherByLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported.');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const ok = await testAPIConnection();
          if (!ok) throw new Error('Backend API not responding.');
          const data = await safeFetch(`${API_BASE_URL}/weather/geo?lat=${coords.latitude}&lon=${coords.longitude}`);
          setWeather(data);
          fetchForecast(coords.latitude, coords.longitude);
        } catch (err) {
          setError(`❌ ${err.message}`);
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
      const data = await safeFetch(`${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}`);
      setForecast(data.daily || []);
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
    const description = weather.weather[0].description.toLowerCase();
    
    // More precise animation selection
    if (main.includes('rain') || description.includes('rain')) return rain;
    if (main.includes('snow') || description.includes('snow')) return snow;
    if (main.includes('thunderstorm') || main.includes('storm') || description.includes('thunder')) return storm;
    if (main.includes('cloud') || description.includes('cloud')) return cloud;
    if (main.includes('clear') || description.includes('clear') || description.includes('sunny')) return clear;
    
    // Default based on temperature if weather condition is unclear
    const temp = weather.main.temp;
    if (temp < 0) return snow;
    if (temp > 25) return clear;
    return cloud;
  };

  const getSuggestions = () => {
    if (!weather) return '';
    const temp = weather.main.temp;
    if (temp < 5) return '🧣 Wear a jacket, it is cold!';
    if (temp <= 25) return '🧥 A light jacket is fine.';
    return '🧢 Stay hydrated and wear sunglasses!';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') getWeather();
  };

  const getForecastTemp = (f) => f.temp ? Math.round(f.temp) : f.main?.temp ? Math.round(f.main.temp) : 'N/A';
  const getForecastDescription = (f) => f.weather?.[0]?.description || 'No description';

  useEffect(() => {
    testAPIConnection();
  }, []);

  return (
    <>
      <Head>
        <title>WeatherMe</title>
        <link rel="icon" href="/logo.png" />
      </Head>
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(to bottom right, #0f0c29, #302b63, #24243e)',
        color: 'white',
        overflow: 'hidden'
      }}>
        {/* Background Animation */}
        {!weather && (
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            opacity: 0.2, 
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Lottie 
              animationData={earth} 
              loop 
              autoplay 
              style={{ width: '60%', height: '60%', maxWidth: '400px', maxHeight: '400px' }} 
            />
          </div>
        )}

        {weather && (
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            opacity: 0.3, 
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Lottie 
              animationData={getAnimation()} 
              loop 
              autoplay 
              style={{ width: '80%', height: '80%', maxWidth: '500px', maxHeight: '500px' }} 
            />
          </div>
        )}

        {/* Main Content - Single Scroll Container */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 0,
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '24rem',
            minHeight: '100vh',
            padding: '2rem 1rem',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              marginBottom: '2rem', 
              textAlign: 'center',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
              🌦️ WeatherMe
            </h1>

            <input
              type="text"
              placeholder="Enter city name"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={handleKeyPress}
              style={{
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#000', 
                textAlign: 'center', 
                width: '100%', 
                marginBottom: '1rem', 
                fontWeight: 'bold',
                border: 'none',
                fontSize: '1rem'
              }}
            />

            <button
              onClick={getWeatherByLocation}
              style={{ 
                backgroundColor: '#bb8fce', 
                color: 'white', 
                padding: '0.75rem 1rem', 
                width: '100%',
                borderRadius: '8px', 
                fontWeight: 'bold', 
                marginBottom: '0.5rem', 
                cursor: 'pointer',
                border: 'none',
                fontSize: '1rem',
                transition: 'background-color 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#a569bd'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#bb8fce'}
            >
              📍 Use My Location
            </button>

            <button
              onClick={getWeather}
              style={{ 
                backgroundColor: '#8e44ad', 
                color: 'white', 
                padding: '0.75rem 1rem', 
                width: '100%',
                borderRadius: '8px', 
                fontWeight: 'bold', 
                marginBottom: '2rem', 
                cursor: 'pointer',
                border: 'none',
                fontSize: '1rem',
                transition: 'background-color 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#7d3c98'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#8e44ad'}
            >
              Get Weather
            </button>

            {loading && (
              <p style={{ 
                marginBottom: '1rem',
                textAlign: 'center',
                fontSize: '1.1rem'
              }}>
                ⏳ Fetching weather data...
              </p>
            )}

            {error && (
              <div style={{ 
                backgroundColor: 'rgba(231, 76, 60, 0.9)', 
                color: '#fff', 
                padding: '1rem',
                borderRadius: '8px', 
                textAlign: 'center', 
                width: '100%', 
                marginBottom: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}>
                {error}
              </div>
            )}

            {weather && (
              <div style={{ 
                marginBottom: '2rem', 
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)', 
                padding: '2rem', 
                borderRadius: '16px', 
                textAlign: 'center',
                width: '100%', 
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 'bold', 
                  marginBottom: '1rem',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}>
                  {weather.name}
                </h2>
                
                <img 
                  src={getFlagUrl(weather.sys.country)} 
                  alt="flag" 
                  style={{ 
                    width: '40px', 
                    height: '30px', 
                    borderRadius: '4px', 
                    margin: '0 auto 1rem auto',
                    display: 'block',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }} 
                />
                
                <p style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.9 }}>
                  {getDateTime()}
                </p>
                
                <div style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                  <p><strong>🌡 Temperature:</strong> {Math.round(weather.main.temp)}°C</p>
                  <p><strong>🌥 Condition:</strong> {weather.weather[0].description}</p>
                  <p><strong>💧 Humidity:</strong> {weather.main.humidity}%</p>
                  <p><strong>🌬 Wind Speed:</strong> {weather.wind.speed} m/s</p>
                </div>
                
                <div style={{ 
                  marginTop: '1.5rem', 
                  padding: '1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  fontStyle: 'italic'
                }}>
                  <strong>💡 {getSuggestions()}</strong>
                </div>
              </div>
            )}

            {forecast.length > 0 && (
              <div style={{ width: '100%', marginBottom: '2rem' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold', 
                  marginBottom: '1.5rem', 
                  textAlign: 'center',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}>
                  📅 3-Day Forecast
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {forecast.slice(1, 4).map((f, idx) => (
                    <div key={idx} style={{ 
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(6px)', 
                      padding: '1.25rem', 
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.2)', 
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                      }}>
                        <div>
                          <p style={{ 
                            fontWeight: 'bold', 
                            fontSize: '1.1rem',
                            marginBottom: '0.5rem'
                          }}>
                            {new Date(f.dt * 1000).toLocaleDateString('en-US', {
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </p>
                          <p style={{ 
                            fontSize: '0.9rem', 
                            textTransform: 'capitalize',
                            opacity: 0.9
                          }}>
                            🌥 {getForecastDescription(f)}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ 
                            fontWeight: 'bold', 
                            fontSize: '1.2rem',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                          }}>
                            🌡 {getForecastTemp(f)}°C
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Bottom spacer */}
            <div style={{ height: '2rem' }}></div>
          </div>
        </div>
      </div>
    </>
  );
}
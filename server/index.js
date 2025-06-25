const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.OPENWEATHER_API_KEY;

// Check for API key on startup
if (!API_KEY) {
  console.error("❌ OPENWEATHER_API_KEY is missing in .env file!");
  console.error("Please add OPENWEATHER_API_KEY=your_api_key_here to your .env file");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Root route - provides API information
app.get('/', (req, res) => {
  res.json({
    message: 'Weather API Server',
    version: '1.0.0',
    endpoints: {
      'GET /weather?city=<city_name>': 'Get current weather by city name',
      'GET /weather/geo?lat=<latitude>&lon=<longitude>': 'Get current weather by coordinates',
      'GET /forecast?lat=<latitude>&lon=<longitude>': 'Get 5-day weather forecast by coordinates',
      'GET /forecast/city?city=<city_name>': 'Get 5-day weather forecast by city name'
    },
    examples: {
      currentWeatherByCity: `${req.protocol}://${req.get('host')}/weather?city=London`,
      currentWeatherByCoords: `${req.protocol}://${req.get('host')}/weather/geo?lat=51.5074&lon=-0.1278`,
      forecastByCoords: `${req.protocol}://${req.get('host')}/forecast?lat=51.5074&lon=-0.1278`,
      forecastByCity: `${req.protocol}://${req.get('host')}/forecast/city?city=London`
    }
  });
});

// Route: Current weather by city name
app.get('/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({ 
      error: 'City name is required',
      usage: 'GET /weather?city=<city_name>'
    });
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          q: city,
          appid: API_KEY,
          units: 'metric',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching city weather:', error.message);
    
    if (error.response?.status === 404) {
      res.status(404).json({ 
        error: 'City not found',
        message: `No weather data found for "${city}"` 
      });
    } else if (error.response?.status === 401) {
      res.status(401).json({ 
        error: 'Invalid API key',
        message: 'Please check your OpenWeatherMap API key' 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Error fetching weather data for city' 
      });
    }
  }
});

// Route: Current weather by geolocation
app.get('/weather/geo', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ 
      error: 'Latitude and longitude are required',
      usage: 'GET /weather/geo?lat=<latitude>&lon=<longitude>'
    });
  }

  // Validate coordinates
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude) || 
      latitude < -90 || latitude > 90 || 
      longitude < -180 || longitude > 180) {
    return res.status(400).json({
      error: 'Invalid coordinates',
      message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
    });
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          lat: latitude,
          lon: longitude,
          appid: API_KEY,
          units: 'metric',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching geo weather:', error.message);
    
    if (error.response?.status === 401) {
      res.status(401).json({ 
        error: 'Invalid API key',
        message: 'Please check your OpenWeatherMap API key' 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Error fetching geolocation weather data' 
      });
    }
  }
});

// Route: 5-day forecast by coordinates
app.get('/forecast', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ 
      error: 'Latitude and longitude are required',
      usage: 'GET /forecast?lat=<latitude>&lon=<longitude>'
    });
  }

  // Validate coordinates
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude) || 
      latitude < -90 || latitude > 90 || 
      longitude < -180 || longitude > 180) {
    return res.status(400).json({
      error: 'Invalid coordinates',
      message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
    });
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast`,
      {
        params: {
          lat: latitude,
          lon: longitude,
          appid: API_KEY,
          units: 'metric',
        },
      }
    );
    
    // Process the forecast data to make it more user-friendly
    const processedData = {
      ...response.data,
      daily: response.data.list.filter((_, idx) => idx % 8 === 0), // One per day
      hourly: response.data.list.slice(0, 24) // Next 24 hours (3-hour intervals)
    };
    
    res.json(processedData);
  } catch (error) {
    console.error('Error fetching forecast:', error.message);
    
    if (error.response?.status === 401) {
      res.status(401).json({ 
        error: 'Invalid API key',
        message: 'Please check your OpenWeatherMap API key' 
      });
    } else if (error.response?.status === 404) {
      res.status(404).json({ 
        error: 'Location not found',
        message: 'No forecast data found for the provided coordinates' 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Error fetching forecast data' 
      });
    }
  }
});

// Route: 5-day forecast by city name
app.get('/forecast/city', async (req, res) => {
  const city = req.query.city;
  
  if (!city) {
    return res.status(400).json({ 
      error: 'City name is required',
      usage: 'GET /forecast/city?city=<city_name>'
    });
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast`,
      {
        params: {
          q: city,
          appid: API_KEY,
          units: 'metric',
        },
      }
    );
    
    // Process the forecast data to make it more user-friendly
    const processedData = {
      ...response.data,
      daily: response.data.list.filter((_, idx) => idx % 8 === 0), // One per day
      hourly: response.data.list.slice(0, 24) // Next 24 hours (3-hour intervals)
    };
    
    res.json(processedData);
  } catch (error) {
    console.error('Error fetching city forecast:', error.message);
    
    if (error.response?.status === 404) {
      res.status(404).json({ 
        error: 'City not found',
        message: `No forecast data found for "${city}"` 
      });
    } else if (error.response?.status === 401) {
      res.status(401).json({ 
        error: 'Invalid API key',
        message: 'Please check your OpenWeatherMap API key' 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Error fetching forecast data for city' 
      });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    apiKey: API_KEY ? 'Configured' : 'Missing'
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: ['/', '/weather', '/weather/geo', '/forecast', '/forecast/city', '/health']
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong on the server'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Weather API Server running on http://localhost:${PORT}`);
  console.log(`📍 Visit http://localhost:${PORT} for API documentation`);
  console.log(`🌤️  API Key loaded: ${API_KEY ? '✅' : '❌'}`);
  console.log(`🔗 Available endpoints:`);
  console.log(`   - GET /weather?city=<city>`);
  console.log(`   - GET /weather/geo?lat=<lat>&lon=<lon>`);
  console.log(`   - GET /forecast?lat=<lat>&lon=<lon>`);
  console.log(`   - GET /forecast/city?city=<city>`);
});
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.OPENWEATHER_API_KEY;

if (!API_KEY) {
  console.warn("⚠️ OPENWEATHER_API_KEY is missing in .env file!");
}

app.use(cors());

// Route: Weather by city name
app.get('/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({ message: 'City name is required' });
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
    res.status(500).json({ message: 'Error fetching weather data for city' });
  }
});

// Route: Weather by geolocation
app.get('/weather/geo', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          lat,
          lon,
          appid: API_KEY,
          units: 'metric',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching geo weather:', error.message);
    res.status(500).json({ message: 'Error fetching geolocation weather data' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${5000}`);
});

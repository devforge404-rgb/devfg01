const axios = require('axios');

async function geocodePlace(placeName) {
  try {
    const url = `${process.env.NOMINATIM_BASE_URL}/search`;
    const response = await axios.get(url, {
      params: {
        q: placeName,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'GreenRouteApp/1.0'
      }
    });

    if (!response.data || response.data.length === 0) {
      throw new Error(`No results found for place: ${placeName}`);
    }

    const result = response.data[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      display_name: result.display_name
    };
  } catch (error) {
    throw new Error(`Geocoding failed: ${error.message}`);
  }
}

module.exports = { geocodePlace };

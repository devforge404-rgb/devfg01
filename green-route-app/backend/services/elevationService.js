const axios = require('axios');

async function getElevationProfile(coordinates) {
  try {
    // Maximum of 100 points
    const maxPoints = 100;
    const step = Math.ceil(coordinates.length / maxPoints);
    
    // Downsample using uniform sampling
    const sampledCoords = [];
    for (let i = 0; i < coordinates.length; i += step) {
      sampledCoords.push(coordinates[i]);
    }
    
    // Build pipe-separated string "lat,lon|lat,lon"
    const locationsString = sampledCoords.map(c => `${c[0]},${c[1]}`).join('|');
    const url = `${process.env.OPENTOPODATA_BASE_URL}/v1/srtm30m`;

    const response = await axios.get(url, {
      params: {
        locations: locationsString
      }
    });

    if (!response.data || !response.data.results) {
      throw new Error(`No elevation data returned`);
    }

    const elevations = response.data.results.map(r => r.elevation || 0);
    
    // Calculate sum of positive rises
    let elevation_gain = 0;
    for (let i = 1; i < elevations.length; i++) {
      const diff = elevations[i] - elevations[i - 1];
      if (diff > 0) {
        elevation_gain += diff;
      }
    }

    return {
      elevations,
      elevation_gain
    };
  } catch (error) {
    throw new Error(`Elevation retrieval failed: ${error.message}`);
  }
}

module.exports = { getElevationProfile };

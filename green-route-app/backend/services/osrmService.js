const axios = require('axios');

async function getRoute(startLat, startLon, endLat, endLon) {
  try {
    // OSRM coordinate order is longitude,latitude
    const coordinates = `${startLon},${startLat};${endLon},${endLat}`;
    const url = `${process.env.OSRM_BASE_URL}/route/v1/driving/${coordinates}`;
    
    const response = await axios.get(url, {
      params: {
        overview: 'full',
        geometries: 'geojson',
        steps: 'true'
      }
    });

    if (!response.data || response.data.code !== 'Ok' || !response.data.routes || response.data.routes.length === 0) {
      throw new Error(`No routes returned from OSRM`);
    }

    const route = response.data.routes[0];
    return {
      distance: route.distance, // in metres
      duration: route.duration, // in seconds
      geometry: route.geometry, // GeoJSON LineString (lon, lat order)
      waypoints: response.data.waypoints // OSRM waypoints array
    };
  } catch (error) {
    throw new Error(`Routing failed: ${error.message}`);
  }
}

module.exports = { getRoute };

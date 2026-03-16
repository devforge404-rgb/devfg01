const { getElevationProfile } = require('../services/elevationService');
const { getRoute } = require('../services/osrmService');

async function elevation(req, res) {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Missing start or end query parameters' });
    }

    const startCoords = start.split(',').map(Number);
    const endCoords = end.split(',').map(Number);

    // Fetch route first
    const route = await getRoute(startCoords[0], startCoords[1], endCoords[0], endCoords[1]);
    
    // Extract coordinates from geometry and flip to [lat, lon]
    const routeCoordinates = route.geometry.coordinates;
    const flippedCoordinates = routeCoordinates.map(coord => [coord[1], coord[0]]);

    const result = await getElevationProfile(flippedCoordinates);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { elevation };

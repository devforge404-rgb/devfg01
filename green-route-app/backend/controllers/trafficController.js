const { getTrafficLevel } = require('../services/trafficService');
const { getRoute } = require('../services/osrmService');

async function traffic(req, res) {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Missing start or end query parameters' });
    }

    const startCoords = start.split(',').map(Number);
    const endCoords = end.split(',').map(Number);

    // Fetch route first for geometry
    const route = await getRoute(startCoords[0], startCoords[1], endCoords[0], endCoords[1]);
    
    // Flip coordinates to [lat, lon]
    const flippedCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

    const result = await getTrafficLevel(flippedCoordinates);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { traffic };

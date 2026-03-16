const { calculateCarbon } = require('../services/carbonService');
const { getRoute } = require('../services/osrmService');

async function carbon(req, res) {
  try {
    const { start, end, vehicle } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Missing start or end query parameters' });
    }

    const startCoords = start.split(',').map(Number);
    const endCoords = end.split(',').map(Number);

    // Fetch route first for distance
    const route = await getRoute(startCoords[0], startCoords[1], endCoords[0], endCoords[1]);
    
    const result = await calculateCarbon(route.distance, vehicle || "car");
    
    // Add distance_km to response
    result.distance_km = parseFloat((route.distance / 1000).toFixed(2));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { carbon };

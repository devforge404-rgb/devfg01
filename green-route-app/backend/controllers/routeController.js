const { getRoute } = require('../services/osrmService');

async function route(req, res) {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Missing start or end query parameters' });
    }

    const startCoords = start.split(',').map(Number);
    const endCoords = end.split(',').map(Number);

    if (startCoords.length !== 2 || endCoords.length !== 2 || startCoords.some(isNaN) || endCoords.some(isNaN)) {
      return res.status(400).json({ error: 'Invalid coordinate format. Must be "lat,lon"' });
    }

    const result = await getRoute(startCoords[0], startCoords[1], endCoords[0], endCoords[1]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { route };

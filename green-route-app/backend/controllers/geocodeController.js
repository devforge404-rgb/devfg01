const { geocodePlace } = require('../services/nominatimService');

async function geocode(req, res) {
  try {
    const { place } = req.query;
    if (!place) {
      return res.status(400).json({ error: 'Missing required query parameter "place"' });
    }

    const result = await geocodePlace(place);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { geocode };

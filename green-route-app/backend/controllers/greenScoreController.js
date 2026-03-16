const { getRoute } = require('../services/osrmService');
const { getElevationProfile } = require('../services/elevationService');
const { getTrafficLevel } = require('../services/trafficService');
const { calculateCarbon } = require('../services/carbonService');

async function greenScore(req, res) {
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

    // Attempt to get the route first, as other APIs depend on it
    let route;
    try {
      route = await getRoute(startCoords[0], startCoords[1], endCoords[0], endCoords[1]);
    } catch (routeError) {
      return res.status(500).json({ error: `Failed to fetch route: ${routeError.message}` });
    }

    const distance_km = route.distance / 1000;
    const duration_min = Math.round(route.duration / 60);
    const flippedCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

    // Run parallel fetches
    const [elevationResult, trafficResult, carbonResult] = await Promise.allSettled([
      getElevationProfile(flippedCoordinates),
      getTrafficLevel(flippedCoordinates),
      calculateCarbon(route.distance, 'car')
    ]);

    // Handle results with fallbacks for failures
    const elevation_gain_m = elevationResult.status === 'fulfilled' ? elevationResult.value.elevation_gain : 0;
    
    // Traffic fallback
    const trafficData = trafficResult.status === 'fulfilled' ? trafficResult.value : {
      congestion_ratio: 0.5,
      traffic_level: "Moderate",
      current_speed: null,
      free_flow_speed: null
    };

    // Carbon fallback
    const co2_kg = carbonResult.status === 'fulfilled' ? carbonResult.value.co2_kg : parseFloat((distance_km * 0.21).toFixed(2));

    // Calculate normalized values
    const congestion_ratio = trafficData.congestion_ratio;
    const congestion_ratio_inverted = 1 - congestion_ratio; // High congestion (low ratio) = worse score -> high inverted value
    const elevation_gain_normalised = Math.min(elevation_gain_m / 500, 1);
    const distance_normalised = Math.min(distance_km / 50, 1);
    const co2_normalised = Math.min(co2_kg / 10, 1);

    // Calculate score
    let green_score = (0.35 * congestion_ratio_inverted)
                    + (0.25 * elevation_gain_normalised)
                    + (0.25 * distance_normalised)
                    + (0.15 * co2_normalised);

    // Clamp and round
    green_score = Math.max(0, Math.min(1, green_score));
    green_score = parseFloat(green_score.toFixed(3));

    // Determine rating
    let green_rating = "F";
    if (green_score <= 0.2) green_rating = "A+";
    else if (green_score <= 0.35) green_rating = "A";
    else if (green_score <= 0.5) green_rating = "B";
    else if (green_score <= 0.65) green_rating = "C";
    else if (green_score <= 0.8) green_rating = "D";

    res.json({
      distance_km: parseFloat(distance_km.toFixed(2)),
      duration_min,
      elevation_gain_m: Math.round(elevation_gain_m),
      traffic_level: trafficData.traffic_level,
      congestion_ratio: parseFloat(congestion_ratio.toFixed(2)),
      co2_kg,
      green_score,
      green_rating,
      geometry: route.geometry,
      waypoints: route.waypoints
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { greenScore };

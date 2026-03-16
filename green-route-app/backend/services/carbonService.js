const axios = require('axios');

async function calculateCarbon(distanceMetres, vehicleType = "car") {
  try {
    const distanceKm = distanceMetres / 1000;

    if (!process.env.CLIMATIQ_API_KEY) {
      return getFallbackCarbon(distanceKm);
    }

    const url = 'https://beta3.api.climatiq.io/estimate';
    const response = await axios.post(url, {
      emission_factor: {
        activity_id: "passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_na-vehicle_age_na-vehicle_weight_na",
        source: "BEIS",
        region: "GB",
        year: 2023,
        lca_activity: "direct",
        data_version: "^21"
      },
      parameters: {
        distance: distanceKm,
        distance_unit: "km"
      }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.CLIMATIQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.data || response.data.co2e === undefined) {
      return getFallbackCarbon(distanceKm);
    }

    return {
      co2_kg: parseFloat(response.data.co2e.toFixed(2)),
      unit: "kg"
    };

  } catch (error) {
    console.error(`Carbon calculation failed: ${error.message}. Returning fallback.`);
    return getFallbackCarbon(distanceMetres / 1000);
  }
}

function getFallbackCarbon(distanceKm) {
  // DEFRA average factor of 0.21 kg CO2/km
  const factor = 0.21;
  const estimatedCo2 = distanceKm * factor;
  return {
    co2_kg: parseFloat(estimatedCo2.toFixed(2)),
    unit: "kg",
    estimated: true
  };
}

module.exports = { calculateCarbon };

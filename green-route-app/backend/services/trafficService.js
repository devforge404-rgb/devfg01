const axios = require('axios');

async function getTrafficLevel(coordinates) {
  try {
    if (!process.env.TOMTOM_API_KEY) {
      return getFallbackTraffic();
    }

    // Use midpoint for representative query point
    const midIndex = Math.floor(coordinates.length / 2);
    const [lat, lon] = coordinates[midIndex];

    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json`;
    
    const response = await axios.get(url, {
      params: {
        point: `${lat},${lon}`,
        key: process.env.TOMTOM_API_KEY
      }
    });

    if (!response.data || !response.data.flowSegmentData) {
      return getFallbackTraffic();
    }

    const { currentSpeed, freeFlowSpeed } = response.data.flowSegmentData;
    const congestion_ratio = freeFlowSpeed > 0 ? currentSpeed / freeFlowSpeed : 0.5;

    let traffic_level = "High";
    if (congestion_ratio >= 0.8) {
      traffic_level = "Low";
    } else if (congestion_ratio >= 0.5) {
      traffic_level = "Moderate";
    }

    return {
      current_speed: currentSpeed,
      free_flow_speed: freeFlowSpeed,
      congestion_ratio,
      traffic_level
    };
  } catch (error) {
    console.error(`Traffic retrieval failed: ${error.message}. Returning fallback.`);
    return getFallbackTraffic();
  }
}

function getFallbackTraffic() {
  return { 
    congestion_ratio: 0.5, 
    traffic_level: "Moderate", 
    current_speed: null, 
    free_flow_speed: null 
  };
}

module.exports = { getTrafficLevel };

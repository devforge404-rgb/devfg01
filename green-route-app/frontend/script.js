const BASE_URL = 'http://localhost:3000/api';

// Initialize Map
const map = L.map('map').setView([51.505, -0.09], 6); // Default to UK

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let routeLayer = null;
let startMarker = null;
let endMarker = null;

// Custom Leaflet Icons (matches theme)
const createCustomIcon = (color) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style='background-color:${color}; width:20px; height:20px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px rgba(0,0,0,0.5);'></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

const startIcon = createCustomIcon('#10b981'); // Green
const endIcon = createCustomIcon('#ef4444');   // Red

// DOM Elements
const form = document.getElementById('route-form');
const startInput = document.getElementById('start-location');
const endInput = document.getElementById('end-location');
const submitBtn = document.getElementById('submit-btn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoader = submitBtn.querySelector('.btn-loader');
const errorBanner = document.getElementById('error-message');
const resultsCard = document.getElementById('results-card');

// UI Helpers
function setLoading(isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        errorBanner.classList.add('hidden');
    } else {
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
}

function showError(msg) {
    errorBanner.textContent = msg;
    errorBanner.classList.remove('hidden');
    setLoading(false);
}

function clearMap() {
    if (routeLayer) map.removeLayer(routeLayer);
    if (startMarker) map.removeLayer(startMarker);
    if (endMarker) map.removeLayer(endMarker);
}

function updateScoreBadge(score, rating) {
    const ring = document.getElementById('score-ring');
    const badge = document.getElementById('score-badge');
    const ratingEl = document.getElementById('rating-letter');
    
    // Set score dasharray (percentage of 100)
    // Formula: (percent * 100) / 100
    const dashValue = score * 100;
    ring.setAttribute('stroke-dasharray', `${dashValue}, 100`);
    
    // Clear old color classes
    ring.className.baseVal = 'circle';
    ratingEl.className = 'rating-letter';
    
    // Assign new color class
    let colorClass = '';
    if (rating === 'A+' || rating === 'A') colorClass = 'rating-a-color';
    else if (rating === 'B') colorClass = 'rating-b-color';
    else if (rating === 'C') colorClass = 'rating-c-color';
    else colorClass = 'rating-df-color';
    
    if(colorClass) {
      ring.classList.add(colorClass);
      ratingEl.classList.add(colorClass);
    }
    
    ratingEl.textContent = rating;
}

// Main logic
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const startStr = startInput.value.trim();
    const endStr = endInput.value.trim();
    
    if (!startStr || !endStr) {
        showError('Please enter both start and end locations.');
        return;
    }
    
    setLoading(true);
    resultsCard.classList.add('hidden');
    
    try {
        // 1. Geocode in parallel
        const [startGeo, endGeo] = await Promise.all([
            fetch(`${BASE_URL}/geocode?place=${encodeURIComponent(startStr)}`).then(res => {
                if(!res.ok) throw new Error(`Could not find location: ${startStr}`);
                return res.json();
            }),
            fetch(`${BASE_URL}/geocode?place=${encodeURIComponent(endStr)}`).then(res => {
                if(!res.ok) throw new Error(`Could not find location: ${endStr}`);
                return res.json();
            })
        ]);
        
        // 2. Fetch Green Score
        const startCoord = `${startGeo.lat},${startGeo.lon}`;
        const endCoord = `${endGeo.lat},${endGeo.lon}`;
        
        const scoreRes = await fetch(`${BASE_URL}/green-score?start=${startCoord}&end=${endCoord}`);
        
        if (!scoreRes.ok) {
            const errData = await scoreRes.json();
            throw new Error(errData.error || 'Failed to calculate green route.');
        }
        
        const data = await scoreRes.json();
        
        // 3. Update UI Map
        clearMap();
        
        // Draw Route line
        // OSRM GeoJSON coords are [lon, lat], Leaflet GeoJSON handles this natively
        routeLayer = L.geoJSON(data.geometry, {
            style: {
                color: '#14b8a6', // Teal
                weight: 5,
                opacity: 0.8
            }
        }).addTo(map);
        
        // Fit map bounds
        map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
        
        // Add markers (Leaflet marker uses [lat, lon])
        startMarker = L.marker([startGeo.lat, startGeo.lon], { icon: startIcon }).addTo(map);
        endMarker = L.marker([endGeo.lat, endGeo.lon], { icon: endIcon }).addTo(map);
        
        // 4. Update Stats Card
        document.getElementById('score-value').textContent = data.green_score.toFixed(3);
        document.getElementById('val-distance').textContent = data.distance_km;
        document.getElementById('val-duration').textContent = data.duration_min;
        document.getElementById('val-co2').textContent = data.co2_kg;
        document.getElementById('val-traffic').textContent = data.traffic_level;
        document.getElementById('val-elevation').textContent = data.elevation_gain_m;
        
        updateScoreBadge(data.green_score, data.green_rating);
        
        // Show Results
        resultsCard.classList.remove('hidden');
        setLoading(false);
        
    } catch (err) {
        showError(err.message);
    }
});

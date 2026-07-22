// js/api.js

/**
 * Fetches nearby services from the Overpass API.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} type - Service type (e.g., 'hospitals', 'police')
 * @param {number} radiusInMeters - Search radius in meters (default 3000)
 * @returns {Promise<Array>} Array of results
 */
export async function fetchNearbyServices(lat, lon, type, radiusInMeters = 3000) {
    // Safety boundaries to prevent overloading the API
    if (radiusInMeters < 1000) radiusInMeters = 1000;
    if (radiusInMeters > 50000) radiusInMeters = 50000;

    // OpenStreetMap tags for physical locations
    const osmTags = {
        'hospitals': '["amenity"="hospital"]',
        'police': '["amenity"="police"]',
        'firefighters': '["amenity"="fire_station"]',
        'clinics': '["amenity"~"clinic|doctors"]', 
        'pharmacies': '["amenity"="pharmacy"]',
        'dentists': '["amenity"="dentist"]',
        'garages': '["shop"="car_repair"]',
        'veterinarians': '["amenity"="veterinary"]',
        'animal_shelters': '["amenity"="animal_shelter"]'
    };

    const tag = osmTags[type];
    if (!tag) throw new Error("Invalid service type");

    // Overpass QL Query
    const query = `
        [out:json][timeout:60];
        (
          node${tag}(around:${radiusInMeters},${lat},${lon});
          way${tag}(around:${radiusInMeters},${lat},${lon});
        );
        out center;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const data = await response.json();
        return data.elements;
    } catch (error) {
        console.error("Failed to fetch data from Overpass:", error);
        return [];
    }
}

/**
 * Converts an address or city name into coordinates using Nominatim.
 * @param {string} query - The location text to search
 * @returns {Promise<Object|null>} {lat, lon} or null if not found
 */
export async function geocodeAddress(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Geocoding network error");
        
        const data = await response.json();
        
        if (data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
        return null; // Localización no encontrada
    } catch (error) {
        console.error("Geocoding failed:", error);
        return null;
    }
}
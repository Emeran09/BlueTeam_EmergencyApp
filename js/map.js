// js/map.js

let map;
let currentMarkers = [];
let userMarker; 

export function initMap(lat, lon) {
    map = L.map('map').setView([lat, lon], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Guardamos la referencia al marcador del usuario
    userMarker = L.circleMarker([lat, lon], {
        color: '#2196F3',
        fillColor: '#2196F3',
        fillOpacity: 0.8,
        radius: 8
    }).addTo(map).bindPopup("<b>You are here</b>").openPopup();
}

export function updateMapCenter(lat, lon) {
    // Mueve la cámara suavemente a la nueva coordenada
    map.setView([lat, lon], 14); 
    // Mueve el punto azul
    userMarker.setLatLng([lat, lon]);
    userMarker.bindPopup("<b>Manual Location</b>").openPopup();
}

export function drawMarkers(places) {
    // 1. Limpiar siempre los marcadores anteriores
    currentMarkers.forEach(marker => map.removeLayer(marker));
    currentMarkers = [];

    // Si no hay lugares, terminamos aquí (el mapa se queda limpio)
    if (!places || places.length === 0) return;

    // 2. Crear una "caja" (bounds) vacía para calcular el auto-zoom
    const bounds = L.latLngBounds();

    // 3. Dibujar nuevos marcadores
    places.forEach(place => {
        const lat = place.lat || place.center.lat;
        const lon = place.lon || place.center.lon;
        
        const name = place.tags && place.tags.name ? place.tags.name : 'Unnamed service';

        const marker = L.marker([lat, lon]).addTo(map)
            .bindPopup(`<b>${name}</b>`);
            
        currentMarkers.push(marker);
        
        // Expandir la "caja" para que incluya esta nueva chincheta
        bounds.extend([lat, lon]);
    });

    // 4. Hacer que la "caja" incluya también la posición del usuario
    if (userMarker) {
        bounds.extend(userMarker.getLatLng());
    }

    // 5. Ajustar la cámara para que quepa toda la caja (con un margen de 30px)
    map.fitBounds(bounds, { padding: [30, 30] });
}
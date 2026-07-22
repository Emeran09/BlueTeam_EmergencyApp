// js/map.js

let map;
let currentMarkers = [];
let userMarker; 
let radiusCircle;

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

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

export function drawRadiusCircle(lat, lon, radiusInMeters) {
    // Si ya existía un círculo de una búsqueda anterior, lo borramos
    if (radiusCircle) {
        map.removeLayer(radiusCircle);
    }
    
    // Dibujamos el nuevo círculo (rojo muy transparente)
    radiusCircle = L.circle([lat, lon], {
        color: '#f03',
        fillColor: '#f03',
        fillOpacity: 0.05,
        weight: 2,
        radius: radiusInMeters
    }).addTo(map);
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

        // Le pasamos el icono rojo al crear el marcador
        const marker = L.marker([lat, lon], { icon: redIcon }).addTo(map)
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
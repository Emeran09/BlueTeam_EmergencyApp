// js/main.js
import { initMap, drawMarkers, updateMapCenter, drawRadiusCircle } from './map.js';
import { fetchNearbyServices } from './api.js';

let userLat, userLon;
let currentSearchRadius = 3000; // Default: 3km
let lastSelectedType = null;    // Tracks the last clicked service type

document.addEventListener('DOMContentLoaded', () => {
    initGeolocation();
    setupButtons();
    setupRadiusSelector();
    setupSearchBox();
});

function initGeolocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLat = position.coords.latitude;
                userLon = position.coords.longitude;
                initMap(userLat, userLon);
            },
            (error) => {
                console.warn("Geolocation denied or failed. Using fallback (Madrid).");
                userLat = 40.4168; 
                userLon = -3.7038;
                initMap(userLat, userLon);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        alert("Your browser does not support geolocation");
    }
}

function setupRadiusSelector() {
    const radiusSelect = document.getElementById('radius-select');
    
    radiusSelect.addEventListener('change', (e) => {
        // Parse the string value from the select to an integer
        currentSearchRadius = parseInt(e.target.value, 10);

        // Dibuja el círculo inmediatamente al cambiar el selector
        if (userLat && userLon) {
            drawRadiusCircle(userLat, userLon, currentSearchRadius);
        }
        
        // UX Magic: Automatically re-fetch if a category was already selected
        if (lastSelectedType && userLat && userLon) {
            fetchAndDrawServices(lastSelectedType, null); // null because there is no button event
        }
    });
}

function setupButtons() {
    const buttons = document.querySelectorAll('.filter-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (!userLat || !userLon) return;
            
            const type = e.currentTarget.getAttribute('data-type');
            lastSelectedType = type; // Save the choice for the radius selector to use later
            
            fetchAndDrawServices(type, e.currentTarget);
        });
    });
}

function setupSearchBox() {
    const searchInput = document.getElementById('manual-location');
    const searchBtn = document.getElementById('btn-search');

    async function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        searchBtn.style.opacity = '0.5'; // Feedback visual
        
        try {
            const coords = await geocodeAddress(query);
            
            if (coords) {
                // Actualizamos las coordenadas globales
                userLat = coords.lat;
                userLon = coords.lon;
                
                // Movemos el mapa
                updateMapCenter(userLat, userLon);
                
                // Si había una categoría seleccionada, la recargamos en la nueva ciudad
                if (lastSelectedType) {
                    fetchAndDrawServices(lastSelectedType, null);
                } else {
                    // Si no, limpiamos los marcadores de la ciudad anterior
                    drawMarkers([]); 
                }
            } else {
                alert("Location not found. Try adding a city name.");
            }
        } catch (error) {
            alert("Error searching for location.");
        } finally {
            searchBtn.style.opacity = '1';
        }
    }

    // Escuchar el clic en el botón
    searchBtn.addEventListener('click', performSearch);
    
    // Escuchar la tecla Enter en el input
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
            searchInput.blur(); // Oculta el teclado del móvil tras pulsar Enter
        }
    });
}

/**
 * Reusable function to fetch data and update the map.
 * @param {string} type - The service type to fetch
 * @param {HTMLElement|null} buttonElement - The button clicked (for visual feedback)
 */

async function fetchAndDrawServices(type, buttonElement) {
    if (buttonElement) {
        buttonElement.style.opacity = '0.5';
    }

    // Asegurarnos de que el círculo esté dibujado
    drawRadiusCircle(userLat, userLon, currentSearchRadius);
    
    try {
        const places = await fetchNearbyServices(userLat, userLon, type, currentSearchRadius);
        
        if (places.length === 0) {
            // BUG FIX: Limpiamos los "fantasmas" del mapa
            drawMarkers([]); 
            alert(`No services found within ${currentSearchRadius / 1000}km.`); 
        } else {
            // Dibuja los marcadores y hace el auto-zoom
            drawMarkers(places);
        }
    } catch (error) {
        drawMarkers([]); // Si hay error de red, también limpiamos el mapa
        alert("Error fetching data. Please check your connection.");
    } finally {
        if (buttonElement) {
            buttonElement.style.opacity = '1';
        }
    }
}
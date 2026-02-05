import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { bbox, featureCollection } from '@turf/turf';
import { useMapStore } from '../../../store/useMapStore';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issues in React Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

import { DrawControl } from './DrawControl';
import { PointsLayer } from './PointsLayer';
import { LocationMarker } from './LocationMarker';

const MapController = () => {
    const map = useMap();
    const { currentProjectId, polygons } = useMapStore();
    const lastProjectIdRef = useRef<string | null>(null);

    // Nota: La geolocalización inicial se ha movido al componente LocationMarker

    // 2. Centrar en el proyecto cuando cambia el ID y hay polígonos
    useEffect(() => {
        // Si no hay proyecto, reseteamos el ref para permitir recargar el mismo proyecto si fuera necesario
        if (!currentProjectId) {
            lastProjectIdRef.current = null;
            return;
        }

        if (currentProjectId !== lastProjectIdRef.current && polygons.length > 0) {
            try {
                const fc = featureCollection(polygons);
                const [minX, minY, maxX, maxY] = bbox(fc); // [lng, lat, lng, lat]

                // Leaflet bounds: [[lat, lng], [lat, lng]] => [[minY, minX], [maxY, maxX]]
                if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
                    map.fitBounds([
                        [minY, minX],
                        [maxY, maxX]
                    ], { padding: [50, 50] });
                }

                lastProjectIdRef.current = currentProjectId;
            } catch (e) {
                console.error("Error centering map:", e);
            }
        }
    }, [currentProjectId, polygons, map]);

    return null;
};


import { MapViewTracker } from './MapViewTracker';
import { MapControls } from './MapControls';
import { TrackingEngine } from '../../navigation/TrackingEngine';
import { NavigationControls } from '../../navigation/NavigationControls';

// ... (MapController stays same)

export const MapCore = () => {
    // Coordenadas por defecto (Centro de Argentina aprox, o neutro)
    const defaultCenter: [number, number] = [-34.6037, -58.3816]; // Buenos Aires
    const defaultZoom = 13;

    // Shared ref for drawn items (polygons) so MapControls can trigger edits
    const featureGroupRef = useRef<L.FeatureGroup | null>(null);

    return (
        <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            className="h-full w-full outline-none"
            zoomControl={false} // Custom controls implemented in MapControls
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* DrawControl manages the layer events and sync, but toolbar is hidden */}
            <DrawControl hideToolbar={true} featureGroupRef={featureGroupRef} />

            <PointsLayer />
            <LocationMarker />

            {/* Navigation Logic & UI */}
            <TrackingEngine />
            <NavigationControls />

            {/* Original Map Controls (will be hidden via internal logic if navigating) */}
            <MapControls featureGroupRef={featureGroupRef} />

            <MapController />
            <MapViewTracker />
        </MapContainer>
    );
};

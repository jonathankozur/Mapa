import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useMapStore } from '../../../store/useMapStore';
import { Feature, Polygon } from 'geojson';

// Fix for Leaflet Draw icon issues usually needed in Webpack/Vite envs
// @ts-ignore
window.type = ''; // Workaround for some leaflet-draw global variable expectations if any

export const DrawControl = () => {
    const map = useMap();
    const addPolygon = useMapStore((state) => state.addPolygon);
    const drawControlRef = useRef<L.Control.Draw | null>(null);

    useEffect(() => {
        if (!map) return;

        // Initialize display group for drawn items
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        // Configure Draw Control
        const drawControl = new L.Control.Draw({
            draw: {
                polygon: {
                    allowIntersection: false,
                    drawError: {
                        color: '#e1e100',
                        message: '<strong>Error:</strong> No puedes cruzar líneas!'
                    },
                    shapeOptions: {
                        color: '#3388ff'
                    }
                },
                // Disable other shapes for MVP
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false,
            },
            edit: {
                featureGroup: drawnItems,
                remove: true,
            }
        });

        map.addControl(drawControl);
        drawControlRef.current = drawControl;

        // Event Handlers
        const handleCreated = (e: any) => {
            const layer = e.layer;
            drawnItems.addLayer(layer);

            // Convert to GeoJSON
            const geoJson = layer.toGeoJSON() as Feature<Polygon>;
            addPolygon(geoJson);
        };

        map.on(L.Draw.Event.CREATED, handleCreated);

        return () => {
            map.removeControl(drawControl);
            map.off(L.Draw.Event.CREATED, handleCreated);
            map.removeLayer(drawnItems);
        };
    }, [map, addPolygon]);

    return null;
};

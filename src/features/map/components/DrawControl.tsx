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
    const { polygons, setPolygons } = useMapStore();
    const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

    // Initialize Draw Control and Event Handlers
    useEffect(() => {
        if (!map) return;

        // Initialize display group
        if (!drawnItemsRef.current) {
            drawnItemsRef.current = new L.FeatureGroup();
            map.addLayer(drawnItemsRef.current);
        }
        const drawnItems = drawnItemsRef.current;

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

        // SYNC: Leaflet -> Store
        const syncToStore = () => {
            if (!drawnItems) return;
            const layers = drawnItems.getLayers();
            const features = layers.map((layer: any) => {
                const geoJson = layer.toGeoJSON();
                return geoJson;
            });
            setPolygons(features as Feature<Polygon>[]);
        };

        const handleCreated = (e: any) => {
            const layer = e.layer;
            drawnItems.addLayer(layer);
            syncToStore();
        };

        const handleEdited = () => {
            syncToStore();
        };

        const handleDeleted = () => {
            syncToStore();
        };

        map.on(L.Draw.Event.CREATED, handleCreated);
        map.on(L.Draw.Event.EDITED, handleEdited);
        map.on(L.Draw.Event.DELETED, handleDeleted);

        return () => {
            map.removeControl(drawControl);
            map.off(L.Draw.Event.CREATED, handleCreated);
            map.off(L.Draw.Event.EDITED, handleEdited);
            map.off(L.Draw.Event.DELETED, handleDeleted);
        };
    }, [map, setPolygons]);

    // SYNC: Store -> Leaflet (e.g. Loading a project)
    useEffect(() => {
        if (!drawnItemsRef.current) return;
        const drawnItems = drawnItemsRef.current;

        const mapCount = drawnItems.getLayers().length;
        const storeCount = polygons.length;

        // Only sync if map is empty and store has data (Load), 
        // or if store is empty and map has data (Clear/New).
        if (mapCount === 0 && storeCount > 0) {
            polygons.forEach((poly) => {
                L.geoJSON(poly, {
                    onEachFeature: (_feature, layer) => {
                        drawnItems.addLayer(layer);
                    }
                });
            });
        } else if (mapCount > 0 && storeCount === 0) {
            drawnItems.clearLayers();
        }
    }, [polygons]);

    return null;
};

import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { useMapStore } from '../../../store/useMapStore';

export const MapViewTracker = () => {
    const map = useMap();
    const setMapView = useMapStore((state) => state.setMapView);

    // Track moves and zoom
    useMapEvents({
        moveend: () => {
            const center = map.getCenter();
            const zoom = map.getZoom();
            setMapView([center.lat, center.lng], zoom);
        },
        zoomend: () => {
            // Redundant with moveend? moveend usually fires after zoomend too, but let's be safe
            const center = map.getCenter();
            const zoom = map.getZoom();
            setMapView([center.lat, center.lng], zoom);
        }
    });

    // Restore on mount
    useEffect(() => {
        const { center, zoom } = useMapStore.getState().mapView;
        if (center && zoom) {
            map.setView(center, zoom, { animate: false });
        }
    }, [map]);

    return null;
};

import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/useMapStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import * as turf from '@turf/turf';

interface TrackingEngineProps {
    thresholdMeters?: number;
}

export const TrackingEngine = ({ thresholdMeters = 15 }: TrackingEngineProps) => {
    const map = useMap();
    const { generatedPoints } = useMapStore();
    const { status, markPointVisited } = useNavigationStore();
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    // 1. Location Tracking
    useEffect(() => {
        if (status !== 'running') {
            map.stopLocate();
            return;
        }

        const onLocationFound = (e: L.LocationEvent) => {
            setUserLocation([e.latlng.lat, e.latlng.lng]);

            // Auto-center map if needed? Let's leave manual control for now to avoid annoyance
            // map.panTo(e.latlng);
        };

        const onLocationError = (e: L.ErrorEvent) => {
            console.warn('Tracking error:', e.message);
        };

        map.on('locationfound', onLocationFound);
        map.on('locationerror', onLocationError);

        map.locate({
            watch: true,
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
        });

        return () => {
            map.off('locationfound', onLocationFound);
            map.off('locationerror', onLocationError);
            map.stopLocate();
        };
    }, [status, map]);

    // 2. Proximity Check
    useEffect(() => {
        if (status !== 'running' || !userLocation || !generatedPoints) return;

        generatedPoints.features.forEach((feature, index) => {
            if (!feature.geometry || feature.geometry.type !== 'Point') return;

            const pointCoords = feature.geometry.coordinates; // [lng, lat]
            // Turf expects [lng, lat]
            const from = turf.point([userLocation[1], userLocation[0]]); // user: [lat, lng] -> [lng, lat]
            const to = turf.point(pointCoords as [number, number]);

            const distance = turf.distance(from, to, { units: 'kilometers' });
            const distanceMeters = distance * 1000;

            if (distanceMeters <= thresholdMeters) {
                markPointVisited(index);
                // Potential Toast trigger here?
            }
        });

    }, [userLocation, generatedPoints, status, thresholdMeters, markPointVisited]);

    return null; // Headless component
};

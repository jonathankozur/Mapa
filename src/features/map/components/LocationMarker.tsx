import { useState, useEffect, useRef } from 'react';
import { useMap, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';

// Estilos para el icono pulsante usando clases de Tailwind
const createPulseIcon = () => {
    return L.divIcon({
        className: 'bg-transparent',
        html: `
            <div class="relative flex items-center justify-center w-6 h-6">
                <span class="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
                <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-sm"></span>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
};

export const LocationMarker = () => {
    const map = useMap();
    const [position, setPosition] = useState<L.LatLng | null>(null);
    const [accuracy, setAccuracy] = useState<number>(0);

    // Estado para controlar si devemos seguir al usuario (Auto-Pan)
    const [isFollowing, setIsFollowing] = useState(true);
    // Ref para saber si es la primera vez que ubicamos
    const isFirstLocation = useRef(true);

    // 1. Detectar cuando el usuario mueve el mapa manualmente para desactivar el seguimiento
    useEffect(() => {
        const handleDragStart = () => {
            if (isFollowing) {
                setIsFollowing(false);
            }
        };

        map.on('dragstart', handleDragStart);
        return () => {
            map.off('dragstart', handleDragStart);
        };
    }, [map, isFollowing]);


    // 2. Control de ubicación eliminado (manejado por MapControls)


    // 3. Lógica de Geolocalización
    useEffect(() => {
        const handleLocationFound = (e: L.LocationEvent) => {
            setPosition(e.latlng);
            setAccuracy(e.accuracy);

            // Logica crítica: ¿Cuándo mover el mapa?
            // 1. Si es la primera vez que se ubica (Arranque)
            // 2. Si el usuario activó explícitamente el seguimiento (isFollowing)
            if (isFirstLocation.current || isFollowing) {
                // Usamos flyTo para animar, pero setView la primera vez es mejor UX (instantáneo)
                if (isFirstLocation.current) {
                    map.setView(e.latlng, 16);
                    isFirstLocation.current = false;
                } else {
                    map.flyTo(e.latlng, map.getZoom());
                }
            }
        };

        const handleLocationError = (e: L.ErrorEvent) => {
            console.warn("Location access denied or error:", e.message);
        };

        map.on('locationfound', handleLocationFound);
        map.on('locationerror', handleLocationError);

        // setView: false es CLAVE aquí para evitar que Leaflet secuestre la cámara
        map.locate({
            setView: false,
            watch: true,
            enableHighAccuracy: true
        });

        return () => {
            map.stopLocate();
            map.off('locationfound', handleLocationFound);
            map.off('locationerror', handleLocationError);
        };
    }, [map, isFollowing]); // Reacciona a cambios en isFollowing

    return position === null ? null : (
        <>
            <Circle
                center={position}
                radius={accuracy}
                pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.1, stroke: false }}
            />
            <Marker position={position} icon={createPulseIcon()}>
            </Marker>
        </>
    );
};

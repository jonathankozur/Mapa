import { MapContainer, TileLayer } from 'react-leaflet';
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

export const MapCore = () => {
    // Coordenadas por defecto (Centro de Argentina aprox, o neutro)
    const defaultCenter: [number, number] = [-34.6037, -58.3816]; // Buenos Aires
    const defaultZoom = 13;

    return (
        <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            className="h-full w-full outline-none"
            zoomControl={false} // Custom controls later
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DrawControl />
            <PointsLayer />
        </MapContainer>
    );
};

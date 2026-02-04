import { CircleMarker, LayerGroup } from 'react-leaflet';
import { useMapStore } from '../../../store/useMapStore';

export const PointsLayer = () => {
    const generatedPoints = useMapStore((state) => state.generatedPoints);

    if (!generatedPoints) return null;

    return (
        <LayerGroup>
            {generatedPoints.features.map((point, index) => {
                const [lng, lat] = point.geometry.coordinates;
                return (
                    <CircleMarker
                        key={index}
                        center={[lat, lng]}
                        pathOptions={{ color: 'red', fillColor: '#f03', fillOpacity: 0.8 }}
                        radius={3}
                    />
                );
            })}
        </LayerGroup>
    );
};

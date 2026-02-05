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



interface DrawControlProps {
    hideToolbar?: boolean;
    featureGroupRef?: React.MutableRefObject<L.FeatureGroup | null>;
}

export const DrawControl = ({ hideToolbar = false, featureGroupRef }: DrawControlProps) => {
    const map = useMap();
    const { polygons, setPolygons } = useMapStore();
    // Use provided ref or fallback to local
    const localRef = useRef<L.FeatureGroup | null>(null);
    const drawnItemsRef = featureGroupRef || localRef;

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

        if (!hideToolbar) {
            map.addControl(drawControl);
        }

        // Expose the draw control to window for debug/hack if needed, or better, leverage hooks eventually.
        // For now, we rely on standard Leaflet Draw events which work even if triggered programmatically via L.Draw.Polygon(map).enable()

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

        // Evitar bucles infinitos:
        // Si el contenido del mapa ya coincide con el store (cantidad), asumimos que está sincronizado
        // OJO: Esto es una simplificación. Si cambiamos de proyecto y ambos tienen 1 polígono, esto fallaba.
        // La solución robusta es comparar IDs o simplemente reconstruir si no estamos editando activamente.
        // Para este MVP, vamos a reconstruir siempre que cambie el store para garantizar consistencia.
        // Esto arregla el bug de cambiar entre proyectos.

        drawnItems.clearLayers();

        polygons.forEach((poly) => {
            L.geoJSON(poly, {
                onEachFeature: (_feature, layer) => {
                    // Restaurar estilo si es necesario, Leaflet Draw usa defaults azules que coinciden con L.geoJSON usualmente
                    drawnItems.addLayer(layer);
                }
            });
        });

    }, [polygons]);

    return null;
};

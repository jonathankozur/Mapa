import { useState } from 'react';
import { useMapStore } from '../../../store/useMapStore';
import { generateGridPoints, generateRoadPoints } from '../utils/generator';
import { Feature, Polygon } from 'geojson';

export const GridControl = () => {
    const { polygons, setGeneratedPoints } = useMapStore();
    const [spacing, setSpacing] = useState<number>(50); // Default 50 meters
    const [useRoads, setUseRoads] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');

    const handleGenerate = async () => {
        if (polygons.length === 0) {
            setMessage('Primero dibuja un polígono en el mapa.');
            return;
        }

        const targetPolygon = polygons[polygons.length - 1] as Feature<Polygon>;
        setLoading(true);
        setMessage('Generando puntos...');

        try {
            const spacingKm = spacing / 1000;
            let points;

            if (useRoads) {
                points = await generateRoadPoints(targetPolygon, {
                    spacing: spacingKm,
                    units: 'kilometers'
                });
            } else {
                points = generateGridPoints(targetPolygon, {
                    spacing: spacingKm,
                    units: 'kilometers',
                    mask: true
                });
            }

            setGeneratedPoints(points);
            setMessage(points.features.length > 0
                ? `Generados ${points.features.length} puntos.`
                : 'No se encontraron puntos en el área seleccionada.'
            );
        } catch (error) {
            console.error(error);
            setMessage('Error generando la grilla. Verifica tu conexión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded shadow-sm border border-gray-200 mt-4">
            <h3 className="font-bold text-gray-700 mb-2">Generador de Grilla</h3>

            <div className="mb-4 space-y-3">
                <div>
                    <label className="block text-sm text-gray-600 mb-1">
                        Espaciado (metros)
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={spacing}
                        onChange={(e) => setSpacing(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="useRoads"
                        checked={useRoads}
                        onChange={(e) => setUseRoads(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="useRoads" className="ml-2 block text-sm text-gray-900">
                        Solo en rutas transitables (Beta)
                    </label>
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full font-medium py-2 px-4 rounded transition-colors ${loading
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
            >
                {loading ? 'Procesando...' : 'Generar Puntos'}
            </button>

            {message && (
                <p className={`mt-3 text-sm text-center ${message.includes('Error') ? 'text-red-500' : 'text-gray-600'} animate-fade-in`}>
                    {message}
                </p>
            )}
        </div>
    );
};

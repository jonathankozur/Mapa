import { useState, useEffect } from 'react';
import { useMapStore } from '../../../store/useMapStore';
import { generateGridPoints, generateRoadPoints } from '../utils/generator';
import { Feature, Polygon } from 'geojson';

export const GridControl = () => {
    const { polygons, setGeneratedPoints, projectSettings, setProjectSettings } = useMapStore();

    // Local state for immediate UI feedback
    const [spacing, setSpacing] = useState<number>(projectSettings.spacing);
    const [useRoads, setUseRoads] = useState<boolean>(projectSettings.useRoads);
    const [rotation, setRotation] = useState<number>(projectSettings.rotation || 0);
    const [gridType, setGridType] = useState<'rect' | 'hex'>(projectSettings.gridType || 'rect');

    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');

    // Sincronizar con projectSettings cuando cambia externamente (al cargar proyecto)
    useEffect(() => {
        setSpacing(projectSettings.spacing);
        setUseRoads(projectSettings.useRoads);
        setRotation(projectSettings.rotation || 0);
        setGridType(projectSettings.gridType || 'rect');
    }, [projectSettings]);

    // Helpers para actualizar estado local y store
    const updateSettings = (updates: Partial<typeof projectSettings>) => {
        // Update local state mirrors
        if (updates.spacing !== undefined) setSpacing(updates.spacing);
        if (updates.useRoads !== undefined) setUseRoads(updates.useRoads);
        if (updates.rotation !== undefined) setRotation(updates.rotation);
        if (updates.gridType !== undefined) setGridType(updates.gridType);

        // Update Store
        setProjectSettings({
            ...projectSettings,
            ...updates
        });
    };

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
                    mask: true,
                    rotation: rotation,
                    gridType: gridType
                });
            }

            setGeneratedPoints(points);
            setMessage(points.features.length > 0
                ? `Generados ${points.features.length} puntos.`
                : 'No se encontraron puntos en el área seleccionada.'
            );
        } catch (error) {
            console.error(error);
            setMessage('Error generando la grilla. Verifica tu conexión o parámetros.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded shadow-sm border border-gray-200 mt-4">
            <h3 className="font-bold text-gray-700 mb-2">Generador de Grilla</h3>

            <div className="mb-4 space-y-4">
                {/* Espaciado */}
                <div>
                    <label className="block text-sm text-gray-600 mb-1">
                        Espaciado (metros): <span className="font-bold">{spacing}</span>
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="500"
                        step="10"
                        value={spacing}
                        onChange={(e) => updateSettings({ spacing: Number(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Rotación */}
                {!useRoads && (
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">
                            Rotación: <span className="font-bold">{rotation}°</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={rotation}
                            onChange={(e) => updateSettings({ rotation: Number(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                )}

                {/* Tipo de Grilla */}
                {!useRoads && (
                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Patrón</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => updateSettings({ gridType: 'rect' })}
                                className={`flex-1 py-1 px-2 text-sm rounded border ${gridType === 'rect'
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Rectangular
                            </button>
                            <button
                                onClick={() => updateSettings({ gridType: 'hex' })}
                                className={`flex-1 py-1 px-2 text-sm rounded border ${gridType === 'hex'
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Hexagonal
                            </button>
                        </div>
                    </div>
                )}

                {/* Checkbox Rutas */}
                <div className="flex items-center pt-2 border-t border-gray-100">
                    <input
                        type="checkbox"
                        id="useRoads"
                        checked={useRoads}
                        onChange={(e) => updateSettings({ useRoads: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="useRoads" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                        Solo en rutas transitables
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

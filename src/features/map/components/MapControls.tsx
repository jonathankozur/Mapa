import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import { useMapStore } from '../../../store/useMapStore';
import { generateGridPoints, generateRoadPoints } from '../../grid/utils/generator';
import { Feature, Polygon } from 'geojson';
import { SettingsModal } from '../../../components/ui/SettingsModal';
import { createPortal } from 'react-dom';

interface MapControlsProps {
    featureGroupRef: React.MutableRefObject<L.FeatureGroup | null>;
}

import { useNavigationStore } from '../../../store/useNavigationStore';

export const MapControls = ({ featureGroupRef }: MapControlsProps) => {
    const map = useMap();
    const { setGeneratedPoints, projectSettings, setSearchOpen } = useMapStore();
    const { status } = useNavigationStore();



    // UI States
    const [isZonesExpanded, setIsZonesExpanded] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeAction, setActiveAction] = useState<'draw' | 'edit' | 'delete' | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Helper to stop current action (and sync if needed)
    const stopActiveAction = () => {
        if (activeAction === 'edit') {
            const mapAny = map as any;
            if (mapAny.editHandlers) {
                mapAny.editHandlers.disable();
                mapAny.editHandlers = null;
                map.fire(L.Draw.Event.EDITED); // Force Sync
            }
        } else if (activeAction === 'delete') {
            const mapAny = map as any;
            if (mapAny.deleteHandlers) {
                mapAny.deleteHandlers.disable();
                mapAny.deleteHandlers = null;
                map.fire(L.Draw.Event.DELETED); // Force Sync
            }
        }
        setActiveAction(null);
    };

    // Handlers
    const handleDraw = () => {
        setIsZonesExpanded(false);
        if (activeAction === 'draw' || isGenerating) return;

        setActiveAction('draw');
        // @ts-ignore
        const drawer = new L.Draw.Polygon(map, {
            allowIntersection: false,
            shapeOptions: { color: '#3388ff' }
        });
        drawer.enable();

        // Listen for stop
        map.once(L.Draw.Event.CREATED, () => {
            setActiveAction(null);
        });
    };

    const handleEdit = () => {
        setIsZonesExpanded(false);
        if (!featureGroupRef.current || isGenerating) return;

        if (activeAction === 'edit') {
            stopActiveAction();
            return;
        }

        setActiveAction('edit');
        // @ts-ignore
        const editHandler = new L.EditToolbar.Edit(map, {
            featureGroup: featureGroupRef.current
        });
        editHandler.enable();
        // @ts-ignore
        map.editHandlers = editHandler;
    };

    const handleDelete = () => {
        setIsZonesExpanded(false);
        if (!featureGroupRef.current || isGenerating) return;

        if (activeAction === 'delete') {
            stopActiveAction();
            return;
        }

        setActiveAction('delete');
        // @ts-ignore
        const deleteHandler = new L.EditToolbar.Delete(map, {
            featureGroup: featureGroupRef.current
        });
        deleteHandler.enable();
        // @ts-ignore
        map.deleteHandlers = deleteHandler;
    };

    const handleGenerate = async () => {
        if (isGenerating) return;

        // 1. Auto-save edits if active
        if (activeAction) {
            stopActiveAction();
            // Tiny yield to let Leaflet update everything
            await new Promise(r => setTimeout(r, 100)); // Increased to 100ms for safety
        }

        // CRITICAL FIX: Get fresh polygons from store state directly, 
        // because the 'polygons' variable in this scope is stale (closure).
        const currentPolygons = useMapStore.getState().polygons;

        if (currentPolygons.length === 0) {
            alert('Dibuja un polígono primero');
            return;
        }

        const targetPolygon = currentPolygons[currentPolygons.length - 1] as Feature<Polygon>;

        setIsGenerating(true);
        try {
            const spacingKm = projectSettings.spacing / 1000;
            let points;

            if (projectSettings.useRoads) {
                // Async: Roads with Timeout
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("La operación tardó demasiado (Timeout 10s)")), 10000);
                });

                // Race between generation and timeout
                points = await Promise.race([
                    generateRoadPoints(targetPolygon, {
                        spacing: spacingKm,
                        units: 'kilometers'
                    }),
                    timeoutPromise
                ]);
            } else {
                // Sync: Grid (Instant)
                points = generateGridPoints(targetPolygon, {
                    spacing: spacingKm,
                    units: 'kilometers',
                    mask: true,
                    rotation: projectSettings.rotation || 0,
                    gridType: projectSettings.gridType || 'rect'
                });
            }
            // @ts-ignore
            setGeneratedPoints(points);
            // @ts-ignore
            alert(`Generados ${points.features.length} puntos`);
        } catch (e: any) {
            console.error(e);
            alert('Error: ' + (e.message || 'Error generando puntos'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLocation = () => {
        if (isGenerating) return;
        map.locate({ setView: true, maxZoom: 16 });
    };

    // Clean up handlers on unmount
    useEffect(() => {
        return () => {
            // @ts-ignore
            if (map.editHandlers) map.editHandlers.disable();
            // @ts-ignore
            if (map.deleteHandlers) map.deleteHandlers.disable();
        };
    }, [map]);

    // Button Components
    const Fab = ({ onClick, icon, active = false, secondary = false, title = '', disabled = false }: any) => (
        <button
            disabled={disabled}
            onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                if (!disabled) onClick();
            }}
            title={title}
            className={`
                flex items-center justify-center rounded-full shadow-lg transition-all
                ${secondary ? 'w-10 h-10 mb-2' : 'w-12 h-12 mb-3'}
                ${active ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-100'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            {icon}
        </button>
    );

    // If navigating, hide controls 
    if (status !== 'idle') return null;

    return (
        <>
            {/* Controls Container - Top Right */}
            <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', marginTop: '60px', marginRight: '10px' }}>
                <div className="leaflet-control flex flex-col items-end">

                    {/* Search (Moved here) */}
                    <Fab
                        onClick={() => setSearchOpen(true)}
                        disabled={isGenerating}
                        title="Buscar Lugar"
                        // Explicitly hidden if search is open? No, user might want to click it again or it might just stay. 
                        // But if search is open, the bar has an 'X'.
                        // Let's just keep it here.
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                    />

                    {/* Zones (Group) */}
                    <div className="flex flex-col items-end relative">
                        <style>{`
                            .leaflet-draw { display: none !important; }
                         `}</style>
                        {isZonesExpanded && !isGenerating && (
                            <div className="absolute top-1 right-14 flex flex-row items-center gap-2 animate-fade-in pr-2">
                                <Fab
                                    secondary
                                    onClick={handleDraw}
                                    active={activeAction === 'draw'}
                                    title="Dibujar Polígono"
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>}
                                />
                                <Fab
                                    secondary
                                    onClick={handleEdit}
                                    active={activeAction === 'edit'}
                                    title="Editar"
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>}
                                />
                                <Fab
                                    secondary
                                    onClick={handleDelete}
                                    active={activeAction === 'delete'}
                                    title="Borrar"
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
                                />
                            </div>
                        )}

                        <Fab
                            onClick={() => setIsZonesExpanded(!isZonesExpanded)}
                            active={isZonesExpanded || activeAction !== null}
                            disabled={isGenerating}
                            title="Zonas"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 4l6.5 13H5.5L12 6z" /></svg>} // Triangle/Pentagon-ish
                        />
                    </div>

                    {/* Generate Points */}
                    <Fab
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        title="Generar Puntos"
                        active={isGenerating}
                        icon={isGenerating ? (
                            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="4" r="2" /><circle cx="12" cy="4" r="2" /><circle cx="20" cy="4" r="2" /><circle cx="4" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="20" cy="12" r="2" /><circle cx="4" cy="20" r="2" /><circle cx="12" cy="20" r="2" /><circle cx="20" cy="20" r="2" /></svg>
                        )}
                    />

                    {/* Separator */}
                    <div className="h-4"></div>

                    {/* Save Project (New) */}
                    <Fab
                        onClick={() => {
                            // Implicit Save by design (Autosave), but maybe trigger a toast or "Project" logic later?
                            // For now, let's keep it as "Configuración" separator or just a visual "Save" that confirms persistence.
                            // User asked for "Save Project button separate".
                            // Let's make it distinct.
                            // Functionally, it just confirms because useMapStore persists.
                            alert('Proyecto guardado correctamente.');
                        }}
                        disabled={isGenerating}
                        title="Guardar Proyecto"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" /></svg>} // Floppy-ish? Actually using Download styling to imply "Safe". Let's use generic save path.
                    />

                    {/* Settings */}
                    <Fab
                        onClick={() => setIsSettingsOpen(true)}
                        disabled={isGenerating}
                        title="Configuración"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>}
                    />

                    {/* Location */}
                    <Fab
                        onClick={handleLocation}
                        disabled={isGenerating}
                        title="Mi Ubicación"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>}
                    />
                </div>
            </div>

            {/* Modal via Portal to avoid map interference */}
            {createPortal(
                <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />,
                document.body
            )}
        </>
    );
};

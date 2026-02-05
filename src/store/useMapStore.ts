import { create } from 'zustand';
import { Feature, Polygon, FeatureCollection, Point } from 'geojson';

interface ProjectSettings {
    spacing: number;
    useRoads: boolean;
    rotation: number;
    gridType: 'rect' | 'hex';
}

interface MapState {
    // Datos del mapa
    polygons: Feature<Polygon>[];
    generatedPoints: FeatureCollection<Point> | null;

    // Proyecto activo
    currentProjectId: string | null;
    projectName: string;
    projectSettings: ProjectSettings;
    mapView: { center: [number, number], zoom: number };
    isSearchOpen: boolean;

    // Acciones de polígonos

    // Acciones de polígonos
    addPolygon: (polygon: Feature<Polygon>) => void;
    setPolygons: (polygons: Feature<Polygon>[]) => void;
    clearPolygons: () => void;

    // Acciones de puntos
    setGeneratedPoints: (points: FeatureCollection<Point> | null) => void;

    // Acciones de proyecto
    setCurrentProject: (id: string | null, name: string) => void;
    setProjectSettings: (settings: ProjectSettings) => void;
    loadProjectData: (
        polygon: Feature<Polygon>,
        points: FeatureCollection<Point> | null,
        settings: ProjectSettings
    ) => void;
    clearProject: () => void;
    setMapView: (center: [number, number], zoom: number) => void;
    setSearchOpen: (isOpen: boolean) => void;
}

import { persist } from 'zustand/middleware';

export const useMapStore = create<MapState>()(
    persist(
        (set) => ({
            // Estado inicial
            polygons: [],
            generatedPoints: null,
            currentProjectId: null,
            projectName: 'Nuevo Proyecto',
            projectSettings: {
                spacing: 150,
                useRoads: true,
                rotation: 0,
                gridType: 'rect'
            },
            mapView: { center: [-34.6037, -58.3816], zoom: 13 },
            isSearchOpen: false,

            // Acciones de polígonos
            addPolygon: (polygon) => set((state) => ({
                polygons: [...state.polygons, polygon]
            })),
            setPolygons: (polygons) => set({ polygons }),
            clearPolygons: () => set({ polygons: [], generatedPoints: null }),

            // Acciones de puntos
            setGeneratedPoints: (points) => set({ generatedPoints: points }),

            // Acciones de proyecto
            setCurrentProject: (id, name) => set({
                currentProjectId: id,
                projectName: name
            }),
            setProjectSettings: (settings) => set({ projectSettings: settings }),
            loadProjectData: (polygon, points, settings) => set({
                polygons: [polygon],
                generatedPoints: points,
                projectSettings: settings
            }),
            clearProject: () => set({
                polygons: [],
                generatedPoints: null,
                currentProjectId: null,
                projectName: 'Nuevo Proyecto',
                projectSettings: {
                    spacing: 150,
                    useRoads: true,
                    rotation: 0,
                    gridType: 'rect'
                }
            }),
            setMapView: (center, zoom) => set({ mapView: { center, zoom } }),
            setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen })
        }),
        {
            name: 'map-storage', // key in localStorage
            partialize: (state) => ({
                polygons: state.polygons,
                generatedPoints: state.generatedPoints,
                projectSettings: state.projectSettings,
                currentProjectId: state.currentProjectId,
                projectName: state.projectName,
                mapView: state.mapView
            }),
        }
    ));

import { create } from 'zustand';
import { Feature, Polygon, FeatureCollection, Point } from 'geojson';

interface MapState {
    polygons: Feature<Polygon>[];
    generatedPoints: FeatureCollection<Point> | null;
    addPolygon: (polygon: Feature<Polygon>) => void;
    setPolygons: (polygons: Feature<Polygon>[]) => void;
    clearPolygons: () => void;
    setGeneratedPoints: (points: FeatureCollection<Point> | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
    polygons: [],
    generatedPoints: null,
    addPolygon: (polygon) => set((state) => ({
        polygons: [...state.polygons, polygon]
    })),
    setPolygons: (polygons) => set({ polygons }),
    clearPolygons: () => set({ polygons: [] }),
    setGeneratedPoints: (points) => set({ generatedPoints: points }),
}));

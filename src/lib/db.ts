import Dexie, { Table } from 'dexie';
import { Feature, Polygon, FeatureCollection, Point } from 'geojson';

/**
 * Interfaz para un proyecto guardado en IndexedDB
 */
export interface Project {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    polygon: Feature<Polygon>;
    points: FeatureCollection<Point> | null;
    settings: {
        spacing: number;
        useRoads: boolean;
        rotation: number;
        gridType: 'rect' | 'hex';
    };
}

/**
 * Clase de base de datos Dexie para Mapa GIS
 */
class MapaDB extends Dexie {
    projects!: Table<Project, string>;

    constructor() {
        super('MapaGIS');

        this.version(1).stores({
            // id es la primary key, indexamos también por name y updatedAt
            projects: 'id, name, updatedAt'
        });
    }
}

// Singleton de la base de datos
export const db = new MapaDB();

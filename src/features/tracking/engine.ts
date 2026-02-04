import { Point } from 'geojson';
import { distance, point } from '@turf/turf';

// Tipos básicos para evitar dependencias circulares
type UUID = string;

export interface GeoPosition {
    latitude: number;
    longitude: number;
    accuracy: number; // en metros
    timestamp: number;
}

export interface TrackablePoint {
    id: UUID;
    geometry: Point; // Geometry nativa de GeoJSON
    status: 'pending' | 'visited' | 'skipped';
}

export interface TrackingConfig {
    /** Radio en metros para considerar un punto visitado */
    visitThresholdMeters: number;
    /** Precisión mínima requerida del GPS en metros para validar una visita */
    minAccuracyMeters: number;
}

type VisitCallback = (pointId: UUID) => void;

/**
 * Motor de Tracking de Puntos.
 * Lógica pura desacoplada de React/UI.
 */
export class TrackingEngine {
    private points: TrackablePoint[] = [];
    private config: TrackingConfig;
    private listeners: VisitCallback[] = [];

    constructor(
        config: TrackingConfig = { visitThresholdMeters: 15, minAccuracyMeters: 25 }
    ) {
        this.config = config;
    }

    /**
     * Carga o actualiza la lista de puntos a monitorear.
     * Se recomienda pasar solo los puntos 'pending'.
     */
    setPoints(points: TrackablePoint[]) {
        // Filtramos solo los pendientes para optimizar, aunque el consumidor podría hacerlo.
        this.points = points.filter(p => p.status === 'pending');
    }

    /**
     * Suscripción a eventos de visita.
     */
    onVisit(callback: VisitCallback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Procesa una nueva lectura de GPS.
     * @returns Lista de IDs de puntos visitados en este update.
     */
    updatePosition(position: GeoPosition): UUID[] {
        // 1. Validar precisión del GPS
        if (position.accuracy > this.config.minAccuracyMeters) {
            // GPS señal muy pobre, ignoramos para evitar falsos positivos
            return [];
        }

        const start = point([position.longitude, position.latitude]);
        const visitedIds: UUID[] = [];

        // 2. Iterar puntos (Optimización: en sets masivos usar Indexación Espacial como RBush)
        for (const p of this.points) {
            const target = point(p.geometry.coordinates);

            // Turf devuelve distancia en km por defecto
            const distKm = distance(start, target, { units: 'kilometers' });
            const distMeters = distKm * 1000;

            if (distMeters <= this.config.visitThresholdMeters) {
                visitedIds.push(p.id);
                this.emitVisit(p.id);
            }
        }

        // 3. Remover visitados de la lista interna para no re-procesarlos inmediatamente
        // (Opcional, depende si queremos estado fresco en cada setPoints)
        if (visitedIds.length > 0) {
            this.points = this.points.filter(p => !visitedIds.includes(p.id));
        }

        return visitedIds;
    }

    private emitVisit(id: UUID) {
        this.listeners.forEach(cb => cb(id));
    }
}

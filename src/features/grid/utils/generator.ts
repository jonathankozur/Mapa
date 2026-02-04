import {
    Feature,
    Polygon,
    Point,
    FeatureCollection,
    bbox,
    pointGrid,
    booleanPointInPolygon,
    buffer,
    featureCollection,
} from '@turf/turf';

/**
 * Interface para las opciones de generación.
 */
export interface GridOptions {
    /** Distancia entre puntos en las unidades especificadas */
    spacing: number;
    /** Unidades de medida para el espaciado (default: 'kilometers') */
    units?: 'degrees' | 'radians' | 'miles' | 'kilometers';
    /** Margen interno en metros para evitar puntos en el borde exacto (opcional) */
    marginMeters?: number;
    /** Si es true, retorna los puntos enmascarados solo dentro del polígono. Si es false, retorna el grid rectangular completo. */
    mask?: boolean;
}

/**
 * Genera una grilla de puntos dentro de un polígono dado.
 * 
 * @param polygon GeoJSON Feature<Polygon> donde se generarán los puntos.
 * @param options Configuración de espaciado y márgenes.
 * @returns FeatureCollection<Point> con los puntos generados.
 */
export function generateGridPoints(
    polygon: Feature<Polygon>,
    options: GridOptions
): FeatureCollection<Point> {
    const { spacing, units = 'kilometers', marginMeters = 0, mask = true } = options;

    let searchPolygon = polygon;

    // 1. Aplicar margen negativo si se especifica (Buffer interno)
    if (marginMeters > 0) {
        // Convertir metros a kilómetros para turf buffer (que usa kms/miles/degrees por defecto)
        const marginValue = -marginMeters / 1000;
        const buffered = buffer(polygon, marginValue, { units: 'kilometers' });

        // Si el margen es muy grande, el polígono puede desaparecer
        if (!buffered) {
            console.warn('El margen es demasiado grande, el polígono resultante es nulo.');
            return featureCollection([]);
        }

        // El buffer puede retornar Multipolygon si el polígono se divide, 
        // manejamos el caso simple tomando la geometría principal o iterando si fuera necesario.
        // Para simplificar este módulo MVP, asumimos que retorna un Feature válido casteable a Polygon si es simple.
        // En producción se debería manejar MultiPolygon exhaustivamente.
        if (buffered.geometry.type === 'Polygon') {
            searchPolygon = buffered as Feature<Polygon>;
        }
    }

    // 2. Calcular Bounding Box (Extensión rectangular del polígono)
    const extent = bbox(searchPolygon);

    // 3. Generar Grilla Rectangular inicial
    const grid = pointGrid(extent, spacing, { units, mask: mask ? searchPolygon : undefined });

    // Nota: turf.pointGrid ya tiene opción 'mask', pero a veces es útil hacerlo manualmente 
    // para mayor control o si se quiere debuggear el bbox.
    // Aquí usamos la opción nativa 'mask' de pointGrid que optimiza el proceso.

    return grid;
}

/**
 * Versión manual de filtrado (alternativa didáctica si no se usara la opción mask de pointGrid)
 */
export function generateGridPointsManual(
    polygon: Feature<Polygon>,
    spacing: number,
    units: 'kilometers' = 'kilometers'
): FeatureCollection<Point> {
    const extent = bbox(polygon);
    const grid = pointGrid(extent, spacing, { units });

    const pointsInside = grid.features.filter((point: Feature<Point>) =>
        booleanPointInPolygon(point, polygon)
    );

    return featureCollection(pointsInside);
}

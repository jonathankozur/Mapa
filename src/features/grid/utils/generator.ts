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
    lineString,
    length,
    along,
    distance,
    transformRotate,
    centroid,
    hexGrid
} from '@turf/turf';
import { fetchRoadsInBBox } from './overpass';

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
    /** Si es true, usa el modo "Rutas" obteniendo datos de OSM */
    useRoads?: boolean;
    /** Rotación de la grilla en grados (0-360) */
    rotation?: number;
    /** Tipo de grilla: rectangular o hexagonal */
    gridType?: 'rect' | 'hex';
}

/**
 * Verifica si un punto candidato está a una distancia mínima de todos los puntos existentes.
 */
function isMinDistanceValid(
    candidate: Feature<Point>,
    existingPoints: Feature<Point>[],
    minDistance: number,
    units: 'degrees' | 'radians' | 'miles' | 'kilometers'
): boolean {
    const threshold = minDistance * 0.8;

    for (const existing of existingPoints) {
        const dist = distance(candidate, existing, { units });
        if (dist < threshold) {
            return false;
        }
    }
    return true;
}

export async function generateRoadPoints(
    polygon: Feature<Polygon>,
    options: GridOptions
): Promise<FeatureCollection<Point>> {
    const { spacing, units = 'kilometers' } = options;

    const polygonBbox = bbox(polygon);
    const roads = await fetchRoadsInBBox(polygonBbox);

    const generatedPoints: Feature<Point>[] = [];

    for (const road of roads) {
        const roadLine = lineString(road.geometry.coordinates);
        const lineLength = length(roadLine, { units });

        for (let dist = 0; dist < lineLength; dist += spacing) {
            const candidate = along(roadLine, dist, { units });
            if (booleanPointInPolygon(candidate, polygon) &&
                isMinDistanceValid(candidate, generatedPoints, spacing, units)) {
                generatedPoints.push(candidate);
            }
        }
    }

    return featureCollection(generatedPoints);
}

/**
 * Genera una grilla de puntos (Rectangular o Hexagonal) con rotación opcional.
 */
export function generateGridPoints(
    polygon: Feature<Polygon>,
    options: GridOptions
): FeatureCollection<Point> {
    const {
        spacing,
        units = 'kilometers',
        marginMeters = 0,
        mask = true,
        rotation = 0,
        gridType = 'rect'
    } = options;

    let searchPolygon = polygon;

    // 1. Aplicar margen negativo si existe
    if (marginMeters > 0) {
        const marginValue = -marginMeters / 1000;
        const buffered = buffer(polygon, marginValue, { units: 'kilometers' });
        if (!buffered) return featureCollection([]);
        if (buffered.geometry.type === 'Polygon') {
            searchPolygon = buffered as Feature<Polygon>;
        }
    }

    // 2. Manejo de Rotación
    // Para rotar la GRILLA sobre el polígono, rotamos el POLÍGONO en sentido inverso,
    // generamos la grilla alineada a los ejes, y luego rotamos todo de vuelta.
    let workingPolygon = searchPolygon;
    let pivot = centroid(searchPolygon);

    if (rotation !== 0) {
        workingPolygon = transformRotate(searchPolygon, -rotation, { pivot });
    }

    const extent = bbox(workingPolygon);

    // 3. Generar Grilla (Rectangular o Hexagonal)
    // Nota: hexGrid devuelve Polígonos (celdas), pointGrid devuelve Puntos.
    // Para hex, usaremos pointGrid pero con offset manual o triangleGrid si estuviera disponible.
    // Turf hexGrid da áreas. Para puntos hexagonales, generamos pointGrid rectangular denso y filtramos
    // o usamos la propiedad 'hexagonal' (triangle) si pointGrid lo soporta (no nativamente en versiones viejas).
    // Implementación manual de grid hexagonal (triangular) es más segura si pointGrid no lo soporta.
    // Revisando docs de Turf: pointGrid no tiene 'hex'. hexGrid sí. 
    // Vamos a usar pointGrid para rectangular, y para hexagonal haremos un truco:
    // Generar pointGrid denso y filtrar filas pares/impares con offset.

    let grid: FeatureCollection<Point>;

    if (gridType === 'hex') {
        // Alternativa robusta para MVP fase 2:
        // Usar hexGrid de turf y tomar el centroide de cada celda hexagonal.
        const hexPolys = hexGrid(extent, spacing, { units, mask: mask ? workingPolygon : undefined });
        const hexCenters = hexPolys.features.map(poly => centroid(poly));
        grid = featureCollection(hexCenters);

    } else {
        // Rectangular Standard
        grid = pointGrid(extent, spacing, { units, mask: mask ? workingPolygon : undefined });
    }

    // 4. Rotar de vuelta los puntos generados
    if (rotation !== 0 && grid.features.length > 0) {
        const rotatedPoints = grid.features.map(pt =>
            transformRotate(pt, rotation, { pivot })
        );
        grid = featureCollection(rotatedPoints);
    }

    // 5. Filtrado final por máscara (si rotamos, el mask de pointGrid se hizo sobre el polígono rotado, 
    // así que debería estar bien. Pero si usamos hexGrid con rotación, hay que verificar).
    // Si la rotación introdujo imprecisiones, hacemos un filtro final pointInPolygon sobre el original.
    // (Omitido por performance a menos que sea necesario).

    return grid;
}

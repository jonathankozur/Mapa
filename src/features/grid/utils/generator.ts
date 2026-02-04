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
    point,
    intersect,
    lineString,
    length,
    along,
    multiLineString
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
}

/**
 * Genera puntos sobre caminos transitables dentro de un polígono.
 */
export async function generateRoadPoints(
    polygon: Feature<Polygon>,
    options: GridOptions
): Promise<FeatureCollection<Point>> {
    const { spacing, units = 'kilometers' } = options;

    // 1. Obtener Roads del API
    const polygonBbox = bbox(polygon);
    const roads = await fetchRoadsInBBox(polygonBbox);

    const generatedPoints: Feature<Point>[] = [];

    // 2. Procesar cada segmento de ruta
    for (const road of roads) {
        // Verificar intersección con el polígono del usuario
        // road es un Feature<LineString>
        const roadLine = lineString(road.geometry.coordinates);

        // Cortamos la línea con el polígono. 
        // turf.intersect devuelve null, Feature<LineString> o Feature<MultiLineString>
        // Nota: intersect a veces es costoso o inestable con geometrías complejas.
        // Una alternativa más rápida es iterar puntos, pero para "rutas" queremos seguir la línea exacto.

        // Para simplificar y robustez en MVP:
        // Generamos puntos sobre TODA la línea que cae en el BBOX (que ya pedimos filtrado)
        // Y SOLO guardamos los que caen dentro del polígono exacto.
        // Esto evita problemas de topología con intersect.

        const lineLength = length(roadLine, { units });

        // Recorrer la línea
        for (let dist = 0; dist < lineLength; dist += spacing) {
            const p = along(roadLine, dist, { units });

            if (booleanPointInPolygon(p, polygon)) {
                generatedPoints.push(p);
            }
        }
    }

    return featureCollection(generatedPoints);
}

/**
 * Genera una grilla de puntos dentro de un polígono dado.
 */
export function generateGridPoints(
    polygon: Feature<Polygon>,
    options: GridOptions
): FeatureCollection<Point> {
    const { spacing, units = 'kilometers', marginMeters = 0, mask = true } = options;

    // ... lógica original de grilla geométrica ...
    let searchPolygon = polygon;

    if (marginMeters > 0) {
        const marginValue = -marginMeters / 1000;
        const buffered = buffer(polygon, marginValue, { units: 'kilometers' });
        if (!buffered) return featureCollection([]);
        if (buffered.geometry.type === 'Polygon') {
            searchPolygon = buffered as Feature<Polygon>;
        }
    }

    const extent = bbox(searchPolygon);
    const grid = pointGrid(extent, spacing, { units, mask: mask ? searchPolygon : undefined });
    return grid;
}

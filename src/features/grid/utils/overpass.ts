import { BBox } from 'geojson';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

export interface RoadSegment {
    type: 'Feature';
    properties: {
        name?: string;
        highway?: string;
    };
    geometry: {
        type: 'LineString';
        coordinates: number[][];
    };
}

/**
 * Fetches drivable roads within a bounding box using Overpass API.
 */
export const fetchRoadsInBBox = async (bbox: BBox): Promise<RoadSegment[]> => {
    // [minX, minY, maxX, maxY] -> [south, west, north, east]
    // Turf bbox is [minX, minY, maxX, maxY] (lng, lat)
    // Overpass expects (south, west, north, east) (lat, lng)

    const [west, south, east, north] = bbox;

    // Query for drivable roads (excluding footways, etc)
    const query = `
        [out:json][timeout:25];
        (
          way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|track)$"]
          (${south},${west},${north},${east});
        );
        out body;
        >;
        out skel qt;
    `;

    try {
        const response = await fetch(OVERPASS_API_URL, {
            method: 'POST',
            body: query
        });

        if (!response.ok) {
            throw new Error(`Overpass API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return parseOverpassResponse(data);
    } catch (error) {
        console.error('Error fetching roads:', error);
        throw error;
    }
};

/**
 * Parses Overpass JSON response into simplified GeoJSON-like LineStrings.
 * We do this manually to avoid heavy dependencies like osmtogeojson for this specific use case.
 */
const parseOverpassResponse = (data: any): RoadSegment[] => {
    const nodes: Record<number, number[]> = {};
    const ways: any[] = [];

    // First pass: Index all nodes
    for (const element of data.elements) {
        if (element.type === 'node') {
            nodes[element.id] = [element.lon, element.lat];
        } else if (element.type === 'way') {
            ways.push(element);
        }
    }

    const segments: RoadSegment[] = [];

    // Second pass: Construct LineStrings from ways
    for (const way of ways) {
        const coordinates = way.nodes
            .map((nodeId: number) => nodes[nodeId])
            .filter((coord: number[] | undefined) => coord !== undefined);

        if (coordinates.length < 2) continue;

        segments.push({
            type: 'Feature',
            properties: {
                name: way.tags?.name,
                highway: way.tags?.highway
            },
            geometry: {
                type: 'LineString',
                coordinates
            }
        });
    }

    return segments;
};

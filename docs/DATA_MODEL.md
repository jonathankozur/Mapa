# Modelo de Datos: Mapa GIS

> **Versión**: 1.0.0
> **Estándar Base**: [GeoJSON (RFC 7946)](https://tools.ietf.org/html/rfc7946)

## 1. Principios del Modelo

1.  **GeoJSON First**: Todas las geometrías se almacenan estandarizadas como GeoJSON Features.
2.  **Relacionalidad Soft**: Las relaciones se mantienen mediante IDs (Foreign Keys) para facilitar la serialización a JSON plano y almacenamiento en IndexedDB/Backend.
3.  **Extensibilidad**: Uso de la propiedad `properties` de GeoJSON para metadatos, pero con interfaces estrictas en TypeScript.

---

## 2. Interfaces TypeScript

### Tipos Base
```typescript
// Identificadores universales (UUID v4 recomendado)
type UUID = string;
type ISO8601 = string; // "2024-03-20T10:00:00Z"

interface AuditFields {
  id: UUID;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}
```

### Zone (Zona de Interés)
Representa un polígono dibujado por el usuario.
```typescript
import { Feature, Polygon } from 'geojson';

interface ZoneProperties {
  name: string;
  color: string; // Hex code "#FF0000"
  description?: string;
  areaSqMeters: number;
}

export interface Zone extends AuditFields {
  type: 'Zone';
  // GeoJSON Feature estricto para polígono
  feature: Feature<Polygon, ZoneProperties>;
  // Configuración asociada para generar la grilla
  gridConfig?: GridConfig; 
}
```

### GridConfig (Configuración de Grilla)
Parámetros para generar puntos dentro de una zona. No se persiste como entidad aislada, sino embebida en la Zona o como preset.
```typescript
export interface GridConfig {
  spacing: number; // Distancia entre puntos
  units: 'meters' | 'kilometers' | 'miles';
  angle: number; // Rotación de la grilla en grados (0-360)
  shape: 'square' | 'triangle' | 'hexagon'; // Patrón de distribución
  mask?: Feature<Polygon>; // Opcional: máscara de exclusión
}
```

### Point (Punto de Interés / Muestreo)
Un punto generado o manual dentro de una zona.
```typescript
import { Feature, Point as GeoPoint } from 'geojson';

export type PointStatus = 'pending' | 'visited' | 'skipped' | 'issue';

interface PointProperties {
  zoneId: UUID; // Link a la Zona padre
  sequenceIndex?: number; // Orden en una ruta
  status: PointStatus;
  notes?: string;
}

export interface TaskPoint extends AuditFields {
  type: 'TaskPoint';
  feature: Feature<GeoPoint, PointProperties>;
}
```

### Route (Ruta Optimizada)
Conjunto ordenado de puntos a recorrer.
```typescript
import { Feature, LineString } from 'geojson';

interface RouteProperties {
  zoneId: UUID;
  totalDistanceMeters: number;
  estimatedDurationSeconds: number;
  status: 'draft' | 'active' | 'completed';
}

export interface Route extends AuditFields {
  type: 'Route';
  pointIds: UUID[]; // Referencia ordenada a los puntos
  pathGeometry?: Feature<LineString>; // La línea visual del camino (Street view o recta)
  properties: RouteProperties;
}
```

---

## 3. Ejemplos JSON

### Ejemplo: Zone con GridConfig
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "Zone",
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z",
  "gridConfig": {
    "spacing": 50,
    "units": "meters",
    "angle": 0,
    "shape": "square"
  },
  "feature": {
    "type": "Feature",
    "properties": {
      "name": "Campo Norte",
      "color": "#3388ff",
      "areaSqMeters": 5000
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [-58.3816, -34.6037],
          [-58.3816, -34.6040],
          [-58.3810, -34.6040],
          [-58.3810, -34.6037],
          [-58.3816, -34.6037]
        ]
      ]
    }
  }
}
```

### Ejemplo: Punto Generado (TaskPoint)
```json
{
  "id": "point-uuid-1",
  "type": "TaskPoint",
  "createdAt": "2024-01-01T12:05:00Z",
  "updatedAt": "2024-01-01T12:05:00Z",
  "feature": {
    "type": "Feature",
    "properties": {
      "zoneId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "pending",
      "sequenceIndex": 0
    },
    "geometry": {
      "type": "Point",
      "coordinates": [-58.3814, -34.6038]
    }
  }
}
```

---

## 4. Persistencia en IndexedDB / Backend

Una base de datos SQL o IndexedDB tendría tablas/stores correspondientes a las entidades principales.

### Stores Recomendados (IndexedDB)
*   `zones`: almacena objetos `Zone` completos.
*   `points`: almacena objetos `TaskPoint`. Índice indispensable en `properties.zoneId`.
*   `routes`: almacena objetos `Route`.

### Normalización
Aunque GeoJSON permite jerarquías anidadas (`FeatureCollection`), se recomienda **aplanar** los puntos en su propia colección para escalabilidad.
*   Una Zona puede tener miles de puntos. Guardarlos dentro del objeto Zona haría que cargar la lista de zonas sea muy pesado.
*   **Decisión**: `Zone` y `TaskPoints` son colecciones separadas vinculadas por `zoneId`.

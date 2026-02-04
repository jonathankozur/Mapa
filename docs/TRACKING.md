# Sistema de Tracking GPS

> **Versión**: 1.0.0
> **Objetivo**: Detectar automáticamente cuando el usuario visita puntos de interés definidos.

## 1. Concepto y Flujo

El sistema funciona como un "Motor de Eventos" que consume actualizaciones de posición del GPS, las compara con una lista de puntos objetivo (Geofencing pasivo) y emite eventos cuando se cumplen las condiciones de visita.

### Diagrama de Flujo

```mermaid
graph TD
    GPS[GPS Provider] -->|New Position (Lat, Lng)| Engine[Tracking Engine]
    Engine -->|Filtrar| Candidates[Puntos 'Pending']
    
    subgraph "Proximity Logic"
        Candidates -->|Calcular Distancia| DistanceCheck{Distancia < Umbral?}
        DistanceCheck -->|No| Wait[Esperar sig. update]
        DistanceCheck -->|Si| Verification[Verificar Precisión GPS]
    end
    
    Verification -->|Baja Precisión (>20m)| Wait
    Verification -->|Alta Precisión| VisitConfirm[Marcar 'Visited']
    
    VisitConfirm -->|Emitir Evento| EventBus[Event Bus]
    EventBus -->|Actualizar UI| UI[React Components]
    EventBus -->|Persistir| Store[Zustand / DB]
```

## 2. Lógica de Detección

### Input
- **Posición Actual**: `{ lat, lng, searchRadius, accuracy }`
- **Lista de Puntos**: `Feature<Point>[]` con estado `pending`.

### Algoritmo
1.  **Filtrado Espacial**: Para optimizar, filtrar puntos que estén fuera de un bounding box amplio alrededor del usuario (opcional si son < 1000 puntos).
2.  **Cálculo de Distancia**: Usar `turf.distance` (fórmula Haversine) entre la posición usuario y cada punto candidato.
3.  **Umbral de Visita (Hit Box)**: Un punto se considera visitado si $d(user, point) \le R_{threshold}$.
    - Recomendado: $R_{threshold} = 10m$ a $20m$.
    - Considerar la precisión del GPS (`accuracy`). Si `accuracy > threshold`, la lectura no es confiable.

## 3. Desacoplamiento (Event Driven)
El `TrackerEngine` no debe conocer detalles de la UI.
- Expone un método `updatePosition(coords)`.
- Mantiene lista de suscripciones o devuelve una lista de `visitEvents`.
- La UI se suscribe: `engine.on('visit', (pointId) => toast.success('Punto capturado!'))`.

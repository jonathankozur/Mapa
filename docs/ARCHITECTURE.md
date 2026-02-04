# Arquitectura de Software: Mapa GIS

> **Versión**: 1.0.0
> **Fecha**: 2026-02-03
> **Estado**: Propuesta

## 1. Visión General

**Mapa** es una aplicación web centrada en el cliente (client-side heavy) para la gestión y análisis de datos geoespaciales simples. Permite a los usuarios dibujar zonas de interés (polígonos), realizar análisis espaciales (grillas) y cálculos de optimización de rutas, todo directamente en el navegador.

### Objetivos Clave
*   **Interactividad**: Feedback visual inmediato al manipular geometrías.
*   **Autonomía**: Procesamiento geoespacial local (usando Turf.js) para minimizar latencia y dependencia de servidor.
*   **Modularidad**: Estructura desacoplada que permite cambiar librerías de mapa o lógica de negocio independientemente.
*   **Accesibilidad**: 100% gratuita y open source.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación |
| :--- | :--- | :--- |
| **Lenguaje** | **TypeScript** | Tipado estático para manejar estructuras de datos GeoJSON complejas con seguridad. |
| **Framework UI** | **React** | Componentización eficiente de la UI y ecosistema maduro. |
| **Map Engine** | **Leaflet** + `react-leaflet` | Ligero, móvil-friendly y suficiente para mapas 2D estándar. Menor curva de aprendizaje que OpenLayers. |
| **G.I.S. Core** | **Turf.js** | "La navaja suiza" del análisis geoespacial en JavaScript. Permite operaciones complejas (intersecciones, grillas, distancias) en el cliente. |
| **Estado** | **Zustand** | Gestión de estado global minimalista y performante, ideal para manejar colecciones grandes de features GeoJSON sin el boilerplate de Redux. |
| **Estilos** | **Tailwind CSS** | Desarrollo rápido de UI moderna y responsive. |
| **Ruteo** | **OSRM (Open Source Routing Machine)** | Servicio de ruteo gratuito (demo server) o localizable si se requiere. Para MVP usaremos endpoints públicos gratuitos o cálculo euclidiano local con Turf. |

---

## 3. Diagrama de Arquitectura

El sistema sigue una arquitectura de **Single Page Application (SPA)** desacoplada.

```mermaid
graph TD
    User[Usuario] -->|Interactúa| UI[React UI Layer]
    
    subgraph "Frontend Application"
        UI -->|Dibuja/Edita| MapComponent[Componente de Mapa (Leaflet)]
        UI -->|Solicita Acción| Store[Estado Global (Zustand)]
        
        Store -->|Actualiza| MapComponent
        
        subgraph "GIS Service Layer"
            GridEngine[Generador de Grillas]
            RouteEngine[Calculador de Rutas]
            GeoUtils[Validadores Geométricos]
            
            GridEngine -->|Usa| Turf[Turf.js Library]
            RouteEngine -->|Usa| Turf
            GeoUtils -->|Usa| Turf
        end
        
        Store -->|Invoca| GISLayer[GIS Service Layer]
    end
    
    subgraph "External Services"
        OSRM[OSRM API / GraphHopper]
        TileServer[OpenStreetMap Tiles]
    end
    
    MapComponent -->|Carga Teselas| TileServer
    RouteEngine -.->|Consulta (Opcional)| OSRM
```

---

## 4. Estructura del Proyecto

Organización tipo "Feature-based" para escalar mejor que la tradicional "Type-based".

```text
src/
├── assets/             # Recursos estáticos
├── components/         # Componentes UI reutilizables (Botones, Paneles)
│   ├── common/         
│   └── layout/
├── features/           # Módulos principales de negocio
│   ├── map/            # Lógica y componentes del mapa
│   │   ├── components/ # MapContainer, DrawTools, LayerControl
│   │   └── hooks/      # useMapInstance, useDraw
│   ├── polygons/       # Gestión de zonas
│   │   ├── utils/      # Lógica de validación
│   │   └── store.ts    # Store específico o slice
│   ├── grid/           # Generación de puntos y grillas
│   └── routing/        # Cálculo de rutas
├── lib/                # Configuración de librerías (Leaflet setup, axios)
├── services/           # Servicios puros (API calls, GeoProcessing complejos)
│   ├── gis.ts          # Fachada para Turf.js
│   └── router.ts       # Cliente para servicio de rutas
├── types/              # Definiciones TypeScript globales (GeoJSON extensions)
├── utils/              # Funciones auxiliares genéricas
└── App.tsx
```

---

## 5. Principios de Diseño

### 5.1. Separación de Datos y Vista (Map)
El mapa (Leaflet) es solo una **vista**. No debe guardar estado de negocio.
*   **Mal**: Leer los polígonos directamente del objeto `L.Map` para guardar.
*   **Bien**: El estado (Zustand) tiene la lista de GeoJSONs. El mapa se renderiza iterando esa lista. Si el usuario edita en el mapa, el evento dispara una actualización al estado.

### 5.2. GeoJSON como Ciudadano de Primera Clase
Toda estructura de datos espacial debe seguir estrictamente la especificación [GeoJSON (RFC 7946)](https://tools.ietf.org/html/rfc7946).
*   Evitar formatos propietarios.
*   Tipos: `Feature<Polygon>`, `FeatureCollection<Point>`.

### 5.3. Inmutabilidad en Geometrías
Las operaciones GIS suelen ser destructivas o devolver nuevos objetos.
*   Siempre tratar las Geometrías como inmutables.
*   Usar funciones puras para transformaciones: `(polygon, gridConfig) => newPoints`.

---

## 6. Detalles de Implementación Clave

### Gestión de Grillas (Turf.js)
Para generar puntos dentro de polígonos:
1.  Tomar `Feature<Polygon>`.
2.  Calcular `bbox` (Bounding Box).
3.  Usar `turf.pointGrid` sobre el bbox.
4.  Filtrar puntos usando `turf.booleanPointInPolygon`.

### Cálculo de Rutas
Dos modos de operación:
1.  **Modo "Vuelo de Pájaro" (Simple/Offline)**: Usar `turf.distance` para calcular matriz de costos y resolver un TSP (Traveling Salesman Problem) simple heurístico en el cliente.
2.  **Modo Vial (Realista)**: Consultar API de OSRM (`http://router.project-osrm.org/route/v1/driving/...`) para obtener polilínea real de calles.

### Manejo de Dibujo
Se usará `Leaflet.Draw` o `react-leaflet-draw` para las interacciones de dibujo, pero interceptando los eventos `onCreated`, `onEdited`, `onDeleted` para normalizar la data a GeoJSON y persistirla en el Store inmediatamente.

# Roadmap Técnico: Proyecto Mapa

> **Objetivo**: Desarrollar una PWA GIS progresiva, empezando por funcionalidades core en el cliente y escalando hacia integraciones complejas y hardware.

---

## 🚩 Fase 0: MVP (Minimum Viable Product)
**Meta**: Tener una herramienta funcional para dibujar zonas y generar puntos.

### Funcionalidades
- [ ] **Mapa Base**: Integración de Leaflet con Tiles de OSM.
- [ ] **Dibujo**: Dibujar polígonos simples sobre el mapa (`Leaflet.Draw`).
- [ ] **Generador**: Generar grilla de puntos básica (solo patrón cuadrado, espaciado fijo).
- [ ] **Vista**: Visualizar puntos generados sobre el mapa.
- [ ] **UI Básica**: Barra lateral para acciones "Dibujar", "Generar", "Limpiar".

### Entregables Técnicos
- Configuración inicial del repositorio (Vite + React + TS).
- Configuración de Tailwind CSS.
- Componente `<MapArea />`.
- Integración básica de Turf.js.

---

## 💾 Fase 1: Persistencia Avanzada (Offline-First)
**Meta**: Que el usuario no pierda sus datos al recargar y pueda trabajar sin conexión.

### Funcionalidades
- [ ] **Guardado Local**: Almacenar Zonas y Puntos automáticamente.
- [ ] **Gestión de Proyectos**: Listar, cargar y borrar zonas guardadas.
- [ ] **Export/Import**: Archivos JSON/GeoJSON para backup manual.

### Entregables Técnicos
- Implementación de **IndexedDB** (vía librería `Dexie.js` o idb).
- Stores de Zustand persistentes.
- Serializadores/Deserializadores de GeoJSON robustos.

---

## ✏️ Fase 2: Editor de Grillas Avanzado
**Meta**: Dar control total al usuario sobre cómo se distribuyen los puntos.

### Funcionalidades
- [ ] **Rotación**: Slider para rotar la grilla (0-360°) alineándola con el cultivo/terreno.
- [ ] **Patrones**: Alternar entre grilla Cuadrada, Triangular (Hexagonal) para mayor densidad.
- [ ] **Márgenes**: Configurar "buffer" negativo (respetar cabeceras).
- [ ] **Edición Manual**: Arrastrar polígonos existentes para ajustar bordes.

### Entregables Técnicos
- UI de configuración avanzada (Sliders, Selects).
- Lógica reactiva de regeneración de puntos (Preview en tiempo real).
- Manejo de actualizaciones de geometría (`Turf.transformRotate`).

---

## 🚀 Fase 3: Optimización de Rutas (TSP)
**Meta**: Guiar al usuario de forma eficiente entre los puntos.

### Funcionalidades
- [ ] **Ruta Óptima**: Ordenar los puntos generados para minimizar distancia de recorrido.
- [ ] **Simulación**: Visualizar el camino sugerido (LineString conectando puntos).
- [ ] **Tracking GPS**: Marcar puntos como "Visitados" al acercarse físicamente.

### Entregables Técnicos
- Algoritmo "Nearest Neighbor" (Vecino más cercano) en cliente para MVP.
- Integración de **Simulated Annealing** o Algoritmos Genéticos para mejorar la ruta (Web Workers).
- Implementación del `TrackingEngine` (Geofencing pasivo).

---

## 🤖 Fase 4: Integración Hardware (Arduino)
**Meta**: Exportar misiones a dispositivos autónomos o de asistencia.

### Funcionalidades
- [ ] **Conexión Serial**: Botón "Conectar Dispositivo" desde el navegador.
- [ ] **Upload de Misión**: Enviar lista de coordenadas (Lat/Lng) a placa Arduino/ESP32.
- [ ] **Protocolo**: Handshake simple para verificar transferencia.

### Entregables Técnicos
- Uso de **Standard Web Serial API** (Chrome/Edge).
- Protocolo de comunicación binario o JSON simple (UART).
- Script/Sketch de ejemplo para el Arduino receptor.

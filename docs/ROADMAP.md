# Roadmap Técnico: Proyecto Mapa

> **Objetivo**: Desarrollar una PWA GIS progresiva, enfocada en la usabilidad móvil y la gestión eficiente de puntos en campo.

---

## 🚩 Fase 0: MVP (Completada)
**Meta**: Tener una herramienta funcional para dibujar zonas y generar puntos.

### Funcionalidades
- [x] **Mapa Base**: Integración de Leaflet con Tiles de OSM.
- [x] **Dibujo**: Dibujar polígonos simples sobre el mapa (`Leaflet.Draw`).
- [x] **Generador**: Generar grilla de puntos básica (solo patrón cuadrado, espaciado fijo).
- [x] **Vista**: Visualizar puntos generados sobre el mapa.
- [x] **UI Básica**: Interfaz estilo Google Maps (FABs, Modal de Configuración).

---

## 💾 Fase 1: Persistencia Avanzada (Completada)
**Meta**: Que el usuario no pierda sus datos al recargar y pueda trabajar sin conexión.

### Funcionalidades
- [x] **Guardado Local**: Almacenar Zonas y Puntos automáticamente (`zustand` + `localStorage`).
- [x] **Gestión de Proyectos**: Listar, cargar y borrar zonas guardadas.
- [x] **Export/Import**: Archivos JSON/GeoJSON para backup manual.

---

## 🏃 Fase 2: Modo Navegación (Ejecución)
**Meta**: Permitir al usuario recorrer los puntos generados en el terreno, marcando su progreso en tiempo real.

### Funcionalidades
- [ ] **Panel de Ejecución**: 
    - Botón **"Iniciar"** para comenzar el recorrido (bloquea edición de mapa).
    - Botones **"Pausar"** y **"Parar"** visibles durante el recorrido.
- [ ] **Tracking en Tiempo Real**:
    - Comparar continuamente la posición del GPS con los puntos generados.
    - Marcar puntos como "Visitados" (cambio de color/icono) al entrar en un radio de proximidad (ej. 10m).
- [ ] **Acciones de Visita**:
    - Disparar un evento al visitar un punto.
    - **MVP**: Mostrar un Popup/Toast con "Punto Visitado".
- [ ] **Resumen de Recorrido**:
    - Al tocar "Parar", mostrar resumen (Puntos visitados / Total, Tiempo transcurrido).
    - Reiniciar el estado de los puntos para permitir un nuevo recorrido.

---

## ✏️ Fase 3: Editor Avanzado y Optimización
**Meta**: Dar control total sobre la grilla y optimizar el orden de visita.

### Funcionalidades
- [ ] **Ajuste de Grilla**: Rotación de grilla y patrones hexagonales.
- [ ] **Ruta Óptima (TSP)**: Ordenar automáticamente los puntos para minimizar la distancia de recorrido (Algoritmo Vecino Más Cercano).
- [ ] **Edición Manual**: Arrastrar puntos individuales o líneas.

---

## 🤖 Fase 4: Integración Hardware (Futuro)
**Meta**: Exportar misiones a dispositivos autónomos.

### Funcionalidades
- [ ] **Conexión Serial**: Web Serial API para conectar con placas Arduino/ESP32.
- [ ] **Upload de Misión**: Transferencia binaria de coordenadas.

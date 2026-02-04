# Algoritmo de Generación de Grillas

> **Propósito**: Explicar el fundamento matemático y lógico detrás de la generación de puntos de muestreo dentro de polígonos irregulares.

## 1. Definición del Problema

Dado un polígono $P$ definido por vértices $V_1, V_2, ..., V_n$, y una distancia de muestreo $d$, el objetivo es encontrar un conjunto de puntos $S = \{p_1, p_2, ...\}$ tal que:

1.  $p_i \in P$ (Todo punto está dentro del polígono).
2.  La distancia entre puntos adyacentes es constante ($d$) en una distribución regular.

## 2. Enfoque: Bounding Box Masking

Debido a la complejidad de generar puntos directamente dentro de formas irregulares, utilizamos la técnica de **"Bounding Box Sampling"**.

### Paso 1: Cálculo del Bounding Box (AABB)
Calculamos el rectángulo envolvente mínimo alineado con los ejes (Axis-Aligned Bounding Box) que contiene a $P$.
$$ Min_x = \min(x_i), \quad Max_x = \max(x_i) $$
$$ Min_y = \min(y_i), \quad Max_y = \max(y_i) $$

### Paso 2: Generación de Grilla Rectangular
Generamos puntos $(x, y)$ iterando sobre el BBox con pasos de tamaño $d$.

Para un BBox definido por latitudes $[\phi_{min}, \phi_{max}]$ y longitudes $[\lambda_{min}, \lambda_{max}]$:

*   **Problema de la Proyección**: La Tierra es esférica. Una distancia constante $d$ en metros no corresponde a grados constantes en longitud.
*   **Solución (Turf.js)**: Utiliza la fórmula de Haversine o Vincenty para calcular el próximo delta en grados dado $d$ en metros, ajustando según la latitud actual (los paralelos se estrechan hacia los polos).

### Paso 3: Test de Inclusión (Ray Casting)
Para cada punto $p$ generado en el rectángulo, verificamos si $p \in P$.
Matemáticamente, usamos el algoritmo **Ray Casting** (o Even-Odd Rule):
*   Trazamos un rayo desde $p$ hacia el infinito.
*   Contamos cuántas veces intercepta los bordes de $P$.
*   Si el número es **impar**, $p$ está dentro. Si es **par**, está fuera.

$$ p \in P \iff \text{impar}(\text{intersecciones}) $$

## 3. Manejo de Margen (Inner Buffer)

A veces se requiere que los puntos no toquen el borde, sino que mantengan un margen $m$.
Matemáticamente, esto equivale a realizar una operación de **Buffer Negativo** (Erosión Morfológica) sobre el polígono $P$ antes de generar la grilla.

Sea $P'$ el polígono erosionado por distancia $-m$.
Generamos los puntos tal que $p \in P'$.

---

## 4. Implementación en Código

Utilizamos la librería [Turf.js](https://turfjs.org/) que implementa estas primitivas de forma optimizada.

```typescript
// Pseudocódigo
extent = turf.bbox(polygon); 
// Genera puntos considerando proyección Geoespacial
grid = turf.pointGrid(extent, spacing, { mask: polygon }); 
```

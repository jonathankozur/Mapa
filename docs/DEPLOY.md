# 🚀 Despliegue en GitHub Pages

Este proyecto está configurado para desplegarse automáticamente en GitHub Pages usando el paquete `gh-pages`.

## Requisitos Previos

- Tener permisos de escritura en el repositorio.
- Node.js instalado.

## Cómo Desplegar

Simplemente ejecuta el siguiente comando en tu terminal:

```bash
npm run deploy
```

Este comando realizará las siguientes acciones automáticamente:
1.  **Build**: Compilará el proyecto (`tsc && vite build`) generando la carpeta `dist`.
2.  **Deploy**: Subirá el contenido de `dist` a la rama `gh-pages` del repositorio remoto.

## Ver la Aplicación

Una vez finalizado el comando, la aplicación estará disponible en:

👉 **https://jonathankozur.github.io/Mapa/**

> **Nota**: Los cambios pueden tardar unos minutos en reflejarse debido a la caché de GitHub.

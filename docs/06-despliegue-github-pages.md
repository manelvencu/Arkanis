# Despliegue con GitHub Pages

## Objetivo

Publicar **Las Tierras de Arkanis** automáticamente en GitHub Pages para que pueda jugarse directamente desde un navegador sin instalar nada en el equipo del jugador.

## Flujo de publicación

1. Se modifica el código del juego en el repositorio `Arkanis`.
2. Los cambios se incorporan a la rama `main`.
3. GitHub Actions instala las dependencias del proyecto.
4. Se ejecuta la compilación de TypeScript y Vite.
5. Vite genera la versión web del juego en la carpeta `dist`.
6. GitHub Pages publica el contenido de `dist`.

## Workflow

El despliegue automático está definido en:

`.github/workflows/deploy-pages.yml`

Se ejecuta automáticamente con cada cambio enviado a `main` y también puede ejecutarse manualmente desde GitHub Actions.

## Tecnología de publicación

- Node.js: solo durante la compilación en GitHub Actions.
- Phaser: motor del videojuego.
- TypeScript: lenguaje de desarrollo.
- Vite: compilación del proyecto web.
- GitHub Pages: alojamiento del juego terminado.

## Equipo del jugador

No requiere Node.js, PHP ni ninguna instalación local.

Solo necesita:

- un navegador web moderno;
- teclado para los controles del juego;
- conexión a Internet para cargar la versión publicada.

## Controles actuales

- Flechas: movimiento.
- Barra espaciadora: rayo mágico.

## Estado

Configuración inicial de GitHub Pages creada. Pendiente validar la primera publicación desde la configuración de Pages del repositorio si GitHub requiere seleccionar `GitHub Actions` como origen de publicación.

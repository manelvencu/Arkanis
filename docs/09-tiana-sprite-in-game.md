# Tiana - sprite in-game

## Formato

- Tamaño de cada frame: 48x48 px.
- Spritesheet técnico: 336x144 px.
- Distribución: 7 columnas x 3 filas.
- Vista lateral izquierda: se obtiene espejando horizontalmente la vista lateral derecha.

## Rasgos visuales validados

Tiana debe conservar en el modo juego:

- piel caucásica;
- cabello rubio;
- ojos verdes;
- dos trenzas largas;
- camiseta lila;
- pantalón corto vaquero azul;
- pulsera azul claro;
- zapatos negros con cordones rosas.

## Filas del spritesheet

1. Fila 0: abajo / frente.
2. Fila 1: lateral derecho.
3. Fila 2: arriba / espalda.

## Columnas

- Columna 0: quieta.
- Columnas 1-3: caminar.
- Columnas 4-6: lanzar rayo.

## Integración en Phaser

Al seleccionar a Tiana, `TrainingScene` carga `public/assets/tiana-spritesheet.png` como spritesheet de 48x48.

Animaciones implementadas:

- `tiana-walk-down`
- `tiana-walk-side`
- `tiana-walk-up`
- `tiana-cast-down`
- `tiana-cast-side`
- `tiana-cast-up`

El proyectil mágico continúa siendo una entidad independiente del sprite del personaje, de forma que pueda desplazarse, colisionar y evolucionar de forma independiente.

Los otros tres personajes continúan con su representación provisional hasta que se creen sus sprites definitivos.

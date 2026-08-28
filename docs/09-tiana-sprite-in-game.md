# Tiana - sprite in-game

## Estado actual de integración

La versión antigua de Tiana sigue integrada temporalmente en `TrainingScene` mediante `public/assets/tiana-spritesheet.png`. Esa hoja se mantiene solo hasta completar el nuevo set definitivo y sustituirla de una vez en Phaser.

## Nuevo sistema de assets

La nueva Tiana se construye con imágenes PNG independientes, sin fondo, en lugar de una única hoja de sprites. El objetivo es ganar nitidez, consistencia visual y facilitar la ampliación de animaciones.

Para simplificar la estructura, cada dirección de movimiento agrupa en su propia carpeta el frame idle y los dos frames de caminar correspondientes. Ejemplo actual:

`public/assets/characters/tiana/walk-down/`

- `tiana-idle-down.png`
- `tiana-walk-down-01.png`
- `tiana-walk-down-02.png`

La misma convención se repetirá con `walk-up`, `walk-left` y `walk-right`.

## Cadencia de animación

Cada dirección de caminar usará inicialmente:

- 1 frame idle;
- 2 frames de caminar alternos.

La secuencia de movimiento podrá reproducirse como `01 -> 02 -> 01 -> 02`, regresando al idle cuando el personaje se detenga.

## Acciones previstas

Además de caminar en las cuatro direcciones, Tiana deberá disponer de imágenes separadas para:

- salto, destinado principalmente a las secciones de vista lateral/plataformas;
- disparo de rayo;
- empuje de elementos.

Estas acciones se crearán como assets independientes manteniendo la misma identidad visual.

## Dirección artística definitiva

La nueva versión abandona el aspecto pixel-art estricto. Tiana debe representarse con ilustración 2D nítida, detallada y limpia, de fantasía aventurera clásica-moderna, manteniendo una lectura clara al reducirse al tamaño de juego.

Rasgos visuales obligatorios:

- piel caucásica;
- cabello rubio;
- ojos verdes;
- dos trenzas largas;
- camiseta lila;
- pantalón corto vaquero azul;
- pulsera azul claro;
- zapatos negros con cordones rosas.

Todas las imágenes de una misma animación deben conservar exactamente el mismo rostro, proporciones, ropa, peinado, paleta y nivel de detalle. Solo cambian la pose y el movimiento necesarios para cada frame.

## Proyectil mágico

El rayo seguirá siendo una entidad independiente del sprite de Tiana. La pose de disparo pertenece al personaje, mientras que el proyectil se desplazará, colisionará y podrá evolucionar visualmente de forma independiente.

## Pendiente de integración

Cuando estén terminadas las imágenes principales de Tiana se actualizará `TrainingScene` para dejar de cargar `public/assets/tiana-spritesheet.png` y utilizar este nuevo sistema de frames individuales.

Los otros tres personajes continúan con su representación provisional hasta que se creen sus sprites definitivos.

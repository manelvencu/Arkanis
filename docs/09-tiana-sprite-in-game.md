# Tiana - sprite in-game

## Estado actual de integración

La nueva versión de Tiana ya está integrada en `TrainingScene` mediante PNG independientes. `public/assets/tiana-spritesheet.png` deja de utilizarse para el movimiento normal del personaje y queda únicamente como recurso antiguo pendiente de retirada cuando se complete también el resto de acciones.

## Nuevo sistema de assets

La nueva Tiana se construye con imágenes PNG independientes, sin fondo, en lugar de una única hoja de sprites. El objetivo es ganar nitidez, consistencia visual y facilitar la ampliación de animaciones.

Cada dirección de movimiento agrupa en su propia carpeta el frame idle y los dos frames de caminar correspondientes.

### Down

`public/assets/characters/tiana/walk-down/`

- `tiana-idle-down.png`
- `tiana-walk-down-01.png`
- `tiana-walk-down-02.png`

### Right

`public/assets/characters/tiana/walk-right/`

- `tiana-idle-right.png`
- `tiana-walk-right-01.png`
- `tiana-walk-right-02.png`

### Up

`public/assets/characters/tiana/walk-up/`

- `tiana-idle-up.png`
- `tiana-walk-up-01.png`
- `tiana-walk-up-02.png`

### Left

No se duplican imágenes para la izquierda. Phaser reutiliza los tres frames de `walk-right` aplicando espejo horizontal (`flipX`) cuando Tiana se desplaza o queda mirando hacia la izquierda.

## Cadencia de animación

Down y up mantienen la alternancia directa entre sus dos frames de caminar porque visualmente funciona correctamente.

Para right y left se utiliza una cadencia más marcada para hacer visible la zancada al reducir el personaje a tamaño de juego:

`walk-right-01 -> idle-right -> walk-right-02 -> idle-right -> ...`

La izquierda reutiliza exactamente esta misma secuencia mediante espejo horizontal. Al detenerse, el personaje vuelve al idle correspondiente.

## Tamaño in-game

En la Zona de entrenamiento Tiana mantiene actualmente un tamaño visual de **68×68 px**, equivalente al tamaño de juego que ya tenía antes del cambio de assets. El cuerpo físico se mantiene separado del tamaño visual para que la colisión siga concentrada en la zona inferior del personaje.

## Disparo de rayo

El proyectil mágico sigue siendo una entidad independiente del sprite de Tiana.

Las poses de disparo definitivas todavía no están creadas. Hasta entonces, al lanzar el rayo se utiliza temporalmente el idle de la dirección correspondiente para que `TrainingScene` ya no dependa de frames de disparo del spritesheet antiguo.

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

## Estado de los otros personajes

Lupe, Manel y Cintia continúan con su representación provisional hasta disponer de sus sprites definitivos.

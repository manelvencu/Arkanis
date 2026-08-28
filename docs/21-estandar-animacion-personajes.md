# Estándar de animación de personajes

## Objetivo

Tiana establece el patrón visual y técnico que deberán seguir Lupe, Manel, Cintia y cualquier personaje jugable nuevo.

## Movimiento cenital

Cada dirección utiliza un PNG idle y dos PNG de caminar.

### Down

Secuencia de movimiento:

`walk-down-01 -> walk-down-02 -> walk-down-01 -> walk-down-02 -> ...`

Al detenerse se muestra `idle-down`.

### Up

Secuencia de movimiento:

`walk-up-01 -> walk-up-02 -> walk-up-01 -> walk-up-02 -> ...`

Al detenerse se muestra `idle-up`.

### Right

Para mejorar la lectura de la zancada al tamaño de juego, la dirección lateral utiliza el idle como postura intermedia:

`walk-right-01 -> idle-right -> walk-right-02 -> idle-right -> ...`

Al detenerse se muestra `idle-right`.

### Left

No es obligatorio crear imágenes independientes para izquierda. Se reutiliza la secuencia de right mediante espejo horizontal (`flipX`):

`walk-right-01 -> idle-right -> walk-right-02 -> idle-right -> ...`

Al detenerse se mantiene `idle-right` con `flipX` activo.

## Reglas visuales

Todos los frames de un mismo personaje deben conservar exactamente la misma identidad visual: rostro, proporciones, ropa, peinado, accesorios, paleta, nivel de detalle y escala aparente. Solo cambia la postura necesaria para representar movimiento o acción.

Los PNG deben utilizar fondo transparente y mantener un lienzo consistente entre frames para evitar saltos de tamaño o de alineación durante la animación.

## Tamaño y física

La imagen visible y el cuerpo físico son conceptos independientes. El personaje puede usar PNG de alta resolución reducidos al tamaño de juego, pero la colisión debe configurarse en coordenadas de mundo y concentrarse en la zona inferior del personaje.

Cambiar la resolución del PNG no debe reducir accidentalmente la caja física. El cuerpo del jugador debe seguir permitiendo:

- colisión con árboles, edificios, vasijas y demás sólidos;
- solapamiento fiable con monedas, pinchos y otros elementos recogibles o dañinos;
- una sensación de desplazamiento natural sin bloquear por la cabeza o los brazos del sprite.

Este criterio es obligatorio para todos los personajes jugables.

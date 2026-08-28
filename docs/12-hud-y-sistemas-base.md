# HUD y sistemas base

## HUD fija

La HUD permanece anclada a la cámara y ocupa casi todo el ancho visible. `hud-frame.png` incorpora su propio fondo interior y no se añade ningún rectángulo de color adicional detrás.

La distribución queda así:

- **Izquierda dentro de `hud-frame`:** nombre del personaje.
- **Centro:** progreso de vasijas.
- **Derecha:** moneda, contador e icono de menú.
- **Debajo de `hud-frame`, zona inferior izquierda:** barra de energía completa, separada del borde izquierdo por más de 50 px.

El marco decorativo es la base visual de la HUD y los elementos funcionales se dibujan por delante mediante profundidades superiores. El icono de menú ofrece respuesta visual al puntero, pero abrir un menú completo queda como `TODO`.

## Energía

- Máximo y valor inicial: **100**.
- Daño de cada contacto con pinchos: **20**.
- Invulnerabilidad posterior: **1,2 segundos**.
- Entre 100 y 30 puntos se usa el relleno dorado.
- Por debajo de 30 puntos se usa el relleno rojo.
- El ancho del relleno se calcula dinámicamente a partir del porcentaje actual.

La barra se presenta fuera del marco principal para no competir con la ornamentación del `hud-frame`, pero permanece fija a cámara.

## Game Over

El comportamiento previsto al llegar a energía 0 es mostrar el asset `public/assets/ui/game-over.png` centrado en pantalla, con un efecto continuo de flameo/pulsación. La pantalla de Game Over permanecerá como máximo **60 segundos** o hasta que el jugador pulse la barra espaciadora. Después se reiniciará la propia escena de entrenamiento desde su estado inicial.

Este comportamiento se conectará al código cuando el asset `game-over.png` esté presente en el repositorio.

## Monedas y progreso

Cada moneda solo puede recogerse una vez, desaparece y suma una unidad al contador. En la zona inferior las monedas marcan un recorrido seguro en zigzag entre los pinchos. No se implementan tienda ni compras.

Los cofres han sido eliminados del entrenamiento. La salida se desbloquea únicamente al destruir las diez vasijas, y la HUD central muestra solo `Vasijas x/10`.

## Rayo mágico

El proyectil usa el asset `public/assets/effects/magic-ray-gold-01.png`. Se mantiene una única imagen base orientada hacia la derecha y Phaser la rota según la dirección de disparo, por lo que el mismo recurso sirve para derecha, izquierda, arriba y abajo. El proyectil conserva su física independiente, velocidad, colisiones con vasijas y sólidos y tiempo de vida.

## Capas y controles

La HUD y los controles táctiles usan profundidades fijas superiores a los elementos del mundo, por lo que el personaje, la barrera y el decorado no pueden taparlos. El mapa conserva movimiento por teclado y tacto, además del disparo mediante espacio o botón táctil.

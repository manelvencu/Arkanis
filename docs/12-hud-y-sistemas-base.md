# HUD y sistemas base

## HUD fija

La HUD permanece anclada a la cámara y ocupa casi todo el ancho visible. A la izquierda muestra el nombre del personaje y una barra de energía; en el centro muestra exclusivamente el progreso de cofres y vasijas; a la derecha muestra la moneda, su contador y el icono de menú. El estado de la salida se comunica visualmente mediante el parpadeo de la barrera cuando queda desbloqueada, sin añadir texto de estado a la HUD.

`hud-frame.png` incorpora ya su propio fondo interior, por lo que no se añade ningún rectángulo de color adicional detrás. El marco es la base visual de la HUD y todos los elementos funcionales —nombre del jugador, barra de energía, progreso, moneda, contador e icono de menú— se dibujan por delante mediante profundidades superiores.

El bloque izquierdo se ajusta para respetar la ornamentación del marco: el nombre del personaje se desplaza hacia el interior y se refuerza con tipografía de estilo clásico y contorno claro, evitando que quede oculto por el remate decorativo. La barra de energía se reduce y centra dentro de `energy-bar-frame.png`, dejando margen interior visible en los cuatro lados para que el relleno no se superponga al marco.

El icono de menú se monta en la zona derecha de la HUD, por delante del marco y ligeramente separado del remate ornamental. Ofrece respuesta visual al puntero, pero abrir un menú completo queda como `TODO`. La caja de mensajes también está fija a cámara en la zona inferior y aparece únicamente mientras el personaje está frente a un cofre.

## Energía

- Máximo y valor inicial: **100**.
- Daño de cada contacto con pinchos: **20**.
- Invulnerabilidad posterior: **1,2 segundos**.
- Entre 100 y 30 puntos se usa el relleno dorado.
- Por debajo de 30 puntos se usa el relleno rojo.
- El ancho del relleno se calcula dinámicamente a partir del porcentaje actual.

Si la energía llega a cero, el prototipo devuelve al personaje al centro del entrenamiento y restaura la energía a 100. Cuando se conecte la escena del primer mundo, su entrada deberá inicializar también la energía a 100.

## Monedas y progreso

Cada moneda solo puede recogerse una vez, desaparece y suma una unidad al contador. No se implementan tienda ni compras. La salida se desbloquea únicamente con los tres cofres leídos y las diez vasijas destruidas.

## Rayo mágico

El proyectil usa el asset `public/assets/effects/magic-ray-gold-01.png`. Se mantiene una única imagen base orientada hacia la derecha y Phaser la rota según la dirección de disparo, por lo que el mismo recurso sirve para derecha, izquierda, arriba y abajo. El proyectil conserva su física independiente, velocidad, colisiones con vasijas y sólidos y tiempo de vida.

## Capas y controles

La HUD y los controles táctiles usan profundidades fijas superiores a los elementos del mundo, por lo que el personaje, la barrera y el decorado no pueden taparlos. El mapa conserva movimiento por teclado y tacto, además del disparo mediante espacio o botón táctil.

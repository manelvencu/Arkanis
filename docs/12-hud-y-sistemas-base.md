# HUD y sistemas base

## Regla general para escenas jugables

A partir de la incorporación de La Aldea, la HUD y los controles dejan de considerarse elementos exclusivos del entrenamiento.

Toda escena jugable de Arkanis debe compartir como mínimo:

- HUD superior común.
- Nombre del personaje.
- Barra de energía.
- Contador de monedas.
- Icono de menú.
- Movimiento por teclado.
- Cruceta táctil.
- Botón táctil de disparo.
- Disparo mediante barra espaciadora.
- Rayo mágico usando el asset real del juego.

No deben crearse variantes independientes del HUD o de los controles para cada mundo salvo decisión explícita de diseño.

`TrainingScene` continúa siendo la referencia visual validada. Las nuevas escenas deben reutilizar la implementación compartida disponible en `src/playableSceneUi.ts`.

## HUD fija

La HUD permanece anclada a una cámara de interfaz y ocupa casi todo el ancho visible. `hud-frame.png` incorpora su propio fondo interior y no se añade ningún rectángulo de color adicional detrás.

La distribución base queda así:

- **Izquierda dentro de `hud-frame`:** nombre del personaje.
- **Centro:** contenido contextual de progreso cuando la escena lo necesite.
- **Derecha:** moneda, contador e icono de menú.
- **Debajo de `hud-frame`, zona inferior izquierda:** barra de energía completa.

El marco decorativo es la base visual de la HUD y los elementos funcionales se dibujan por delante mediante profundidades superiores.

## Cámara de interfaz

Las escenas jugables nuevas deben separar mundo e interfaz mediante cámaras:

- cámara principal para escenario, personaje, proyectiles y elementos físicos;
- cámara UI para HUD, energía, monedas, menú y controles táctiles.

La cámara principal ignora los objetos UI y la cámara UI ignora los objetos del mundo.

De esta forma la interfaz permanece fija y conserva tamaño y posición aunque el mundo utilice zoom o seguimiento de cámara.

## Energía

- Máximo y valor inicial normal: **100**.
- Entre 100 y 30 puntos se usa el relleno dorado.
- Por debajo de 30 puntos se usa el relleno rojo.
- El ancho del relleno se calcula dinámicamente a partir del porcentaje actual.

Las reglas de daño pueden variar por escena. En entrenamiento, por ejemplo, cada contacto con pinchos resta 20 puntos y existe una ventana de invulnerabilidad posterior.

## Monedas

El contador de monedas forma parte del HUD común y debe existir también en escenas donde todavía no haya monedas recogibles. El valor mostrado puede comenzar en 0 o recibir en el futuro el saldo global del jugador.

La tienda de La Aldea todavía no tiene economía definitiva, por lo que su diseño no altera por ahora este sistema base.

## Menú

El icono de menú forma parte del mínimo común de una pantalla jugable.

Durante el desarrollo, cuando `DEV_MODE = true`, abre `DevMenuScene`, que permite saltar entre escenas del proyecto.

En una versión final de producción este mismo icono podrá conectarse al menú real del juego sin alterar el resto del HUD.

## Rayo mágico

El proyectil base usa:

`public/assets/effects/magic-ray-gold-01.png`

Se mantiene una única imagen orientada originalmente hacia la derecha y Phaser la rota según la dirección de disparo.

Características comunes:

- disparo con barra espaciadora;
- disparo con botón táctil;
- orientación según dirección actual del personaje;
- física independiente;
- velocidad y tiempo de vida controlados por código;
- debe ser un proyectil real, no una forma geométrica provisional.

Las colisiones y efectos específicos dependerán de cada mundo.

## Controles táctiles

La cruceta y el botón de magia deben conservar la misma posición, escala y estilo visual utilizados en entrenamiento.

Los controles táctiles se dibujan en la cámara UI y admiten movimiento diagonal mediante lectura combinada de direcciones.

## Módulo compartido `playableSceneUi.ts`

Las nuevas escenas jugables reutilizan:

`src/playableSceneUi.ts`

Funciones principales:

### `preloadPlayableUiAssets(scene)`

Carga los assets comunes de HUD, energía, moneda, menú y rayo.

### `createPlayableUi(...)`

Construye la interfaz y devuelve un controlador con:

- `touchDirections`
- `consumeShootRequest()`
- `updateEnergy()`
- `updateCoins()`
- `ignoreWorldObject()`

Este módulo se creó para evitar que cada nueva pantalla reproduzca manualmente el sistema del entrenamiento.

## Compatibilidad con entrenamiento

`TrainingScene` conserva actualmente su implementación validada y sus refinamientos HD en `hdRenderingRefinement.ts`.

No se migrará de forma agresiva a la nueva base compartida mientras exista riesgo de introducir regresiones. El estándar visual y funcional, sin embargo, es el mismo.

## Game Over

El comportamiento de Game Over sigue documentado de forma específica en `docs/13-game-over.md`.

## Documentación relacionada

Para la evolución completa desde la salida del entrenamiento hasta La Aldea, menú técnico y decisiones de arquitectura, consultar:

`docs/23-flujo-transicion-menu-dev-aldea-y-estandar-jugable.md`

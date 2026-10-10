# HUD y sistemas base

## Regla general

Toda escena jugable de Arkanis debe reutilizar la misma implementación base de HUD y controles.

La fuente de verdad es:

`src/playableSceneUi.ts`

No deben crearse HUD independientes por mundo.

## Elementos comunes

El controlador compartido incluye:

- nombre del personaje;
- energía;
- monedas;
- texto contextual;
- icono de menú;
- cruceta táctil;
- botón de rayo;
- soporte de teclado;
- cámara UI independiente.

## Cámara de interfaz

Las escenas jugables separan mundo e interfaz:

- cámara principal: escenario, personaje, NPC, proyectiles y objetos físicos;
- cámara UI: HUD y controles.

La cámara principal ignora los objetos UI y la cámara UI ignora el mundo.

Esto evita que el zoom o el seguimiento de la cámara desplacen la interfaz.

## Barra de energía — sistema actual

La implementación anterior usaba:

- un frame independiente;
- un relleno dorado o rojo;
- escalado dinámico del ancho.

Ese modelo fue sustituido porque podía generar desalineaciones visuales.

### Sistema vigente

Cada nivel de energía usa una **imagen completa**, que contiene frame y relleno ya alineados.

Ruta:

`public/assets/ui/hud/energy/`

Convención:

`energy-bar-frame-{nivel}.png`

Niveles previstos:

- 0
- 10
- 20
- 30
- 40
- 50
- 60
- 70
- 80
- 90
- 100

El juego precarga estas once texturas.

El valor real se limita a 0–100 y se redondea al múltiplo de 10 más cercano:

- 84 -> 80;
- 86 -> 90;
- 95 -> 100.

La imagen se cambia con `setTexture()`, conservando una única posición central.

### Posición actual

En `playableSceneUi.ts`:

- `ENERGY_CENTER_X = 150 * HD_SCALE`
- `ENERGY_CENTER_Y = 90 * HD_SCALE`

La barra completa se escala conservando proporciones dentro de un máximo aproximado de:

- 300 px lógicos de ancho;
- 74 px lógicos de alto.

### Regla de assets

Los once PNG deben tener:

- fondo transparente;
- mismo lienzo;
- mismas dimensiones;
- marco en la misma posición;
- únicamente cambia la cantidad/color de energía.

Así cada estado puede sustituirse sin saltos de posición ni escala.

## Estado de energía

Máximo normal: 100.

La lógica jugable mantiene el valor numérico real aunque la representación visual se cuantice en pasos de 10.

No debe inferirse el valor del jugador a partir de la textura mostrada.

## Monedas

El contador forma parte del HUD compartido y debe persistir entre escenas cuando corresponda.

La sincronización entre ZE y La Aldea usa Phaser Registry y el bridge de progreso.

## Estado contextual

`PlayableUiController` expone:

- `updateEnergy()`
- `updateCoins()`
- `updateStatus()`
- `consumeShootRequest()`
- `ignoreWorldObject()`

En ZE, por ejemplo, `updateStatus()` muestra el progreso de vasijas.

## TrainingScene

TrainingScene **ya utiliza el HUD común**.

`hdRenderingRefinement.ts` elimina el HUD histórico creado por la escena y monta `createPlayableUi()`, manteniendo intacta la lógica de juego de entrenamiento.

Por tanto, cualquier cambio visual del HUD compartido debe reflejarse también en ZE, La Aldea e interiores jugables.

## Controles

### Teclado

- cursores: movimiento;
- espacio: rayo.

### Táctil

- cruceta inferior izquierda;
- botón de magia inferior derecha;
- soporte multitáctil;
- movimiento diagonal.

## Menú

En `DEV_MODE`, el icono de menú abre `DevMenuScene`.

La versión final podrá reutilizar el mismo icono para el menú real sin modificar el resto del HUD.

## Rayo mágico

Asset común:

`public/assets/effects/magic-ray-gold-01.png`

El proyectil es una entidad física independiente y se orienta según la dirección del personaje.

## Regla de evolución

Cualquier nuevo nivel debe usar este módulo compartido.

Si una escena necesita información específica, debe añadirla mediante el controlador común o una extensión compatible, no creando una segunda HUD.

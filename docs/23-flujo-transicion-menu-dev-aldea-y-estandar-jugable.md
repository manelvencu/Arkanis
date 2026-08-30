# Flujo de transición, menú de desarrollo, La Aldea y estándar mínimo jugable

Este documento recoge la evolución reciente del proyecto desde el final de la zona de entrenamiento hasta la primera definición jugable de **La Aldea**, incluyendo decisiones narrativas, menú técnico, iteraciones visuales y el estándar común que deben compartir todas las escenas jugables.

## 1. Salida del entrenamiento y transición narrativa

Al completar el entrenamiento y atravesar el portal, el juego deja de mostrar un mensaje provisional de fin de entrenamiento y pasa a una secuencia narrativa real.

La escena responsable es `WorldMapScene`.

Flujo definido:

1. Fundido a negro al atravesar el portal.
2. Texto inicial:
   - `El viaje por las Tierras de Arkanis comienza ahora.`
3. Aparición de la joya completa de Arkanis.
4. Efecto de ruptura de la joya:
   - flash de cámara;
   - pequeño shake;
   - desaparición de la joya completa;
   - aparición de la versión dividida en ocho piezas.
5. Texto:
   - `Ocho mundos guardan las piezas de la gran joya de Arkanis.`
6. Aparición del mapa vertical de Arkanis en primer plano.
7. El mismo mapa se utiliza ampliado, oscurecido y desenfocado como fondo para rellenar el formato horizontal.
8. Se destaca **La Aldea**.
9. El jugador puede continuar con teclado, clic o toque; si no hace nada, existe un timeout de 60 segundos.
10. Se realiza un zoom pronunciado hacia el rótulo `La Aldea` del propio mapa.
11. Fundido a negro.
12. Entrada en `AldeaScene`.

### Assets utilizados

- `public/assets/maps/arkanis-world-map.png`
- `public/assets/story/joya-completa-arkanis.png`
- `public/assets/story/joya-trozos-arkanis.png`

### Ajustes de ritmo

La duración inicial del texto se amplió respecto a la primera versión para que la frase pueda leerse con calma. El `hold` del texto inicial quedó aumentado a unos 3 segundos, además de sus fundidos de entrada y salida.

El zoom final hacia La Aldea también se reforzó: el objetivo pasó de un zoom moderado a uno aproximadamente del doble, alrededor de `5.6x`, para que la transición termine acercándose claramente al nombre antes del fundido.

### Punto de referencia de La Aldea

La posición del zoom se fijó a partir de la imagen real del mapa y del centro visual del texto `La Aldea`.

Referencia aproximada sobre la imagen original:

- ancho: 1220 px
- alto: 1567 px
- centro del rótulo: x ≈ 510, y ≈ 907

Por ello el objetivo normalizado se calcula como:

- `x = 510 / 1220`
- `y = 907 / 1567`

La intención es siempre apuntar al **nombre impreso en el mapa**, no al centro geométrico de la región.

## 2. Menú técnico de desarrollo

Se decidió no crear un pequeño popup dentro del HUD, porque a medida que el juego crezca habrá muchas escenas y subescenas.

La solución adoptada es un menú de desarrollo independiente, pensado exclusivamente para producción y pruebas.

### Principios

- Fondo negro.
- Interfaz deliberadamente simple.
- Listado de escenas organizado por bloques.
- Preparado para crecer hasta decenas de accesos.
- Scroll vertical.
- `ESC` vuelve a la escena desde la que se abrió.
- Seleccionar una entrada permite saltar directamente a la escena elegida.

### Accesos iniciales

Incluye accesos de desarrollo a:

- Intro.
- Selección de personaje.
- Entrenamiento.
- Cabaña 1.
- Cabaña 2.
- Cabaña 3.
- Secuencia de joya + mapa.
- Mapa directamente.
- La Aldea.

### Activación

Existe un flag propio:

`src/devMode.ts`

con `DEV_MODE = true` durante el desarrollo.

No se usa `import.meta.env.DEV` como criterio principal porque el proyecto se prueba normalmente desde GitHub Pages, donde Vite compila en modo producción aunque siga siendo una build de desarrollo funcional.

Cuando llegue el momento de publicar una versión final para jugadores, bastará con desactivar `DEV_MODE`.

### Integración con el HUD

En desarrollo, el icono de menú del HUD funciona como puerta de entrada al menú técnico.

El comportamiento se conectó inicialmente mediante `devMenuRefinement.ts` para `TrainingScene`. Posteriormente el nuevo estándar de escenas jugables incorpora ya la posibilidad de lanzar el menú técnico desde la UI compartida.

## 3. Primera definición de La Aldea

La Aldea no se considera todavía uno de los grandes mundos con reto principal. Su función es ser una zona tranquila de transición y aprendizaje contextual.

Objetivos previstos para fases posteriores:

- interacción con aldeanos;
- diálogos;
- una cabaña/tienda;
- compra de objetos con monedas;
- obstáculos sencillos para familiarizarse con movimiento y entorno;
- pequeñas recompensas por explorar;
- salida posterior hacia el siguiente mundo.

No se ha fijado todavía el contenido definitivo de la tienda.

## 4. Tamaño de La Aldea

Para la primera versión se validó un mapa lógico de:

- **30 columnas × 22 filas**
- grid lógico de **32 × 32 px**
- tamaño total: **960 × 704 px lógicos**

Este tamaño se considera suficiente para esta pantalla.

La cámara sigue al personaje y trabaja con el sistema de render HD ya adoptado por el proyecto.

## 5. Iteraciones visuales realizadas en La Aldea

### 5.1 Primera beta visual completa

La primera versión de `AldeaScene` se montó con muchos elementos provisionales para evaluar sensación general del espacio:

- camino;
- plaza;
- casas;
- tienda;
- pozo;
- árboles;
- arbustos;
- piedras;
- vallas;
- aldeanos placeholder;
- monedas;
- cartel de salida.

La conclusión fue que el tamaño del mapa era correcto, pero se decidió borrar todo el contenido y reconstruir la escena desde una base mínima.

### 5.2 Reinicio de la escena

Se eliminó todo salvo:

- personaje;
- hierba;
- tierra del camino;
- plaza central.

La nueva regla espacial quedó definida así:

- el personaje comienza en la **parte inferior izquierda**;
- comienza mirando **hacia la derecha**;
- desde ese punto nace un camino de tierra;
- el camino avanza hacia la **parte superior derecha**;
- la diagonal no debe ser recta: debe sentirse irregular y natural;
- el camino atraviesa una plaza central redonda también de tierra;
- el resto del terreno es hierba.

### 5.3 Ajuste del camino

Después de la primera base limpia se hicieron dos cambios:

- ancho del camino reducido aproximadamente un **30%** respecto a la primera versión;
- trazado más serpenteante e irregular.

La plaza central circular se mantiene con su tamaño y posición actuales mientras se refine el resto.

### 5.4 Grid de desarrollo

Se activó una plantilla de grid sobre La Aldea para poder ajustar elementos mediante coordenadas.

Convención:

- celdas lógicas de 32 px;
- referencias tipo `C01/F01`, `C02/F01`, etc.;
- líneas principales cada 5 columnas/filas con mayor contraste.

La grid es una herramienta de desarrollo y no debe formar parte de la presentación final del juego.

## 6. Error detectado: HUD específico de La Aldea

Durante una iteración se creó en La Aldea un HUD y controles propios que solo imitaban aproximadamente los del entrenamiento.

Esto se consideró incorrecto.

Se fijó entonces una regla de arquitectura importante:

> **Toda escena jugable debe compartir el mismo sistema base de HUD, energía, monedas, menú, controles y disparo.**

No se deben volver a crear variantes visuales independientes de estos elementos por escena.

## 7. Estándar mínimo obligatorio de cualquier escena jugable

A partir de esta decisión, toda pantalla considerada jugable debe disponer como mínimo de:

### HUD

- mismo marco visual usado en entrenamiento;
- nombre del personaje;
- barra de energía;
- contador de monedas;
- icono de menú;
- elementos fijos a cámara.

### Energía

- máximo normal: 100;
- barra dorada en estado normal;
- barra roja al entrar en nivel crítico;
- visualización dinámica según porcentaje.

La lógica concreta de daño puede variar según cada mundo, pero la representación base debe ser común.

### Movimiento

- teclado mediante cursores;
- control táctil con cruceta;
- soporte para movimiento simultáneo/diagonal;
- mismos tamaños y posiciones visuales de los controles base.

### Disparo

- botón táctil de magia/rayo;
- barra espaciadora en teclado;
- proyectil gráfico real, no un rectángulo provisional;
- asset compartido:
  - `public/assets/effects/magic-ray-gold-01.png`
- orientación según dirección del personaje;
- física independiente;
- velocidad y tiempo de vida equivalentes al sistema base de entrenamiento salvo que una mecánica futura justifique explícitamente otra cosa.

### Menú

- el icono de menú debe estar siempre presente en escenas jugables;
- durante `DEV_MODE`, abre `DevMenuScene`;
- en producción podrá conectarse más adelante al menú real del juego.

## 8. Módulo compartido `playableSceneUi.ts`

Para evitar repetir lógica, se creó:

`src/playableSceneUi.ts`

Este módulo encapsula la UI base reutilizable para las escenas jugables nuevas.

Funciones principales:

### `preloadPlayableUiAssets(scene)`

Carga los recursos compartidos:

- HUD;
- barra de energía;
- relleno dorado;
- relleno rojo;
- moneda;
- icono de menú;
- rayo mágico.

### `createPlayableUi(...)`

Crea y devuelve un controlador común con:

- `touchDirections`
- `consumeShootRequest()`
- `updateEnergy()`
- `updateCoins()`
- `ignoreWorldObject()`

La UI trabaja con una cámara propia para permanecer fija mientras el mundo se mueve.

### Cámara UI

Se utiliza una cámara separada para HUD y controles.

Principio:

- cámara principal: mundo y personaje;
- cámara UI: HUD, energía, monedas, menú y controles;
- la cámara principal ignora objetos de UI;
- la cámara UI ignora objetos del mundo.

Esto evita que el zoom y el seguimiento del personaje deformen o desplacen los controles.

## 9. Relación con `TrainingScene`

`TrainingScene` sigue siendo la **referencia visual y funcional** del estándar.

Su HUD y controles habían sido refinados previamente en `hdRenderingRefinement.ts` para adaptarse a render 1920×1080 manteniendo el mundo lógico y el zoom del juego.

El objetivo de `playableSceneUi.ts` no es rediseñar entrenamiento, sino ofrecer a las nuevas escenas una implementación común que reproduzca el mismo lenguaje y comportamiento.

A medio plazo, si conviene, se podrá migrar también TrainingScene a esta base común para reducir duplicación, pero no se hará mientras pueda introducir regresiones en una escena ya validada.

## 10. Incidencia de compilación durante la refactorización

La primera versión del módulo común produjo un error TypeScript durante GitHub Actions:

`src/playableSceneUi.ts(...): error TS2322: Type 'Arc' is not assignable to type 'void'.`

El origen era una función flecha declarada con retorno `void` que devolvía implícitamente el resultado de `setFillStyle(...)`.

Se corrigió convirtiéndola en una función con cuerpo explícito:

```ts
const restoreMagic = (): void => {
  magicButton.setFillStyle(...);
};
```

La incidencia es útil como referencia para futuros refinamientos: en callbacks tipados explícitamente como `(): void`, evitar expresiones que devuelvan objetos Phaser de forma implícita.

## 11. Archivos principales relacionados

- `src/scenes/WorldMapScene.ts`
- `src/scenes/AldeaScene.ts`
- `src/scenes/DevMenuScene.ts`
- `src/worldMapTransitionRefinement.ts`
- `src/devMenuRefinement.ts`
- `src/devMode.ts`
- `src/playableSceneUi.ts`
- `src/hdRenderingRefinement.ts`
- `src/gridDebugOverlay.ts`
- `src/main.ts`

Assets principales:

- `public/assets/maps/arkanis-world-map.png`
- `public/assets/story/joya-completa-arkanis.png`
- `public/assets/story/joya-trozos-arkanis.png`
- `public/assets/environment/hud-frame.png`
- `public/assets/environment/energy-bar-frame.png`
- `public/assets/environment/energy-bar-fill-gold.png`
- `public/assets/environment/energy-bar-fill-red.png`
- `public/assets/environment/coin-gold-01.png`
- `public/assets/environment/menu-icon-01.png`
- `public/assets/effects/magic-ray-gold-01.png`

## 12. Regla de proyecto consolidada

A partir de este punto se considera norma de desarrollo:

> **Una escena jugable de Arkanis no se considera completa ni válida si no incorpora el estándar mínimo común de interacción.**

Ese estándar incluye siempre:

- HUD;
- energía;
- monedas;
- menú;
- movimiento por teclado;
- movimiento táctil;
- botón de disparo;
- rayo mágico real;
- compatibilidad con la arquitectura HD y cámaras del proyecto.

Cada mundo podrá añadir sus propias mecánicas, enemigos, inventario, objetivos, NPC, obstáculos o interfaces contextuales, pero nunca deberá romper ni sustituir esta base común sin una decisión explícita de diseño.
# Arkanis — índice y estado actual

Este documento es la **referencia principal del estado actual del proyecto**. Consolida lo realizado en los tres hilos de trabajo **Arkanis**, **Arkanis 2** y **Arkanis 3 / chat actual**.

Cuando una decisión antigua entre en conflicto con este documento o con el código actual de `main`, prevalece el código actual y después este resumen.

## Flujo jugable actual

1. `IntroScene`.
2. `CharacterSelectScene`.
3. `TrainingScene` / Zona de Entrenamiento.
4. Interiores de las tres cabañas de entrenamiento.
5. `WorldMapScene`: secuencia narrativa y zoom hacia **La Aldea**.
6. `AldeaScene`.
7. Interiores jugables de La Aldea:
   - cabaña de monedas;
   - tienda de vino;
   - cabaña de bendición/pareja;
   - iglesia.
8. Próxima transición pendiente: **La Aldea -> mapa del mundo -> zoom hacia Las Tierras del Fuego**.

## Arquitectura actual

- Phaser 4.2.1.
- TypeScript.
- Vite.
- Render físico: 1920 × 1080.
- Escenas exteriores/interiores con espacio lógico propio y cámaras.
- UI jugable común en `src/playableSceneUi.ts`.
- Estado compartido de energía/monedas entre entrenamiento y Aldea mediante Phaser Registry y `src/playerProgressBridge.ts`.
- Menú técnico controlado por `DEV_MODE`.

Escenas registradas actualmente:

- `IntroScene`
- `CharacterSelectScene`
- `TrainingScene`
- `CabinOneScene`
- `CabinTwoScene`
- `CabinThreeScene`
- `VillageCabinScene`
- `ChurchInteriorScene`
- `WorldMapScene`
- `AldeaScene`
- `DevMenuScene`
- `GameOverScene`

## HUD común

Toda escena jugable debe reutilizar `src/playableSceneUi.ts`.

Elementos comunes:

- nombre del personaje;
- energía;
- monedas;
- información contextual;
- menú;
- cruceta táctil;
- botón de rayo;
- soporte simultáneo de teclado y táctil.

### Energía

La energía ya no se dibuja combinando un frame con un relleno escalado.

Se utilizan imágenes completas por nivel:

`public/assets/ui/hud/energy/energy-bar-frame-{nivel}.png`

Niveles previstos:

`0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100`

El valor real se redondea al múltiplo de 10 más cercano para seleccionar la textura.

La barra completa se posiciona como una sola imagen, evitando desalineaciones internas entre marco y relleno.

**Nota de trabajo:** durante la sustitución de assets puede faltar temporalmente alguno de estos PNG. Antes de dar el HUD por cerrado deben existir los once archivos.

## Estándar de navegación

La regla consolidada es:

> **Área jugable positiva + autoridad en el centro entre los pies.**

Todo lo no declarado como jugable queda bloqueado.

Documentos de referencia:

- `docs/grid-navigation-standard.md`
- `docs/interior-grid-collisions.md`

## Interiores

Los interiores actuales trabajan a:

- 960 × 540 px lógicos;
- 30 columnas;
- 15 filas;
- celda de 32 × 36 px;
- velocidad de referencia: 135 px/s;
- punto de pies: aproximadamente +25 px respecto al centro lógico del sprite.

Las grids visuales fueron herramientas temporales de definición y **ya no deben mostrarse en juego** una vez validada cada habitación.

Mapas de colisión:

- `src/interiorCollisionMaps.ts`: cabañas de ZE.
- `src/villageInteriorCollisionMaps.ts`: cabañas de La Aldea.
- `src/churchInteriorCollisionMap.ts`: iglesia.

## La Aldea exterior

La Aldea usa:

- 30 columnas;
- 22 filas;
- celda de 32 × 32 px;
- tamaño lógico 960 × 704 px;
- punto de pies exterior: aproximadamente +20 px.

La whitelist exterior vive en:

- `src/aldeaWalkableGrid.ts`
- `src/aldeaWalkableGridRefinement.ts`

Entradas exactas actuales:

- Iglesia: `C18F7`, `C19F7`.
- Cabaña derecha superior / blessing: `C26F13`.
- Tienda de vino: `C22F19`, `C22F20`.
- Cabaña inferior izquierda / coins: `C5F18`, `C5F19`.

Toda celda declarada como entrada se incorpora automáticamente al conjunto jugable.

La transición se dispara al estar el centro entre los pies en una celda de entrada e intentar avanzar hacia arriba.

## Interiores de La Aldea

### Coins

Interior jugable definido y validado. Contiene monedas recogibles persistentes.

### Wine

Interior jugable definido y validado. Incluye NPC y recuperación de energía.

### Blessing

Interior jugable definido y validado. Incluye la pareja de NPC y mensaje de bendición.

### Iglesia

Solo es jugable el pasillo central:

- F8–F15;
- C14–C17.

## Estado del progreso del jugador

La energía y las monedas no deben reiniciarse al pasar:

`TrainingScene -> WorldMapScene -> AldeaScene`

La sincronización actual usa Phaser Registry y el bridge de progreso.

## Mapa del mundo

Está implementada la transición narrativa entre ZE y La Aldea:

- joya completa;
- ruptura en ocho fragmentos;
- mapa de Arkanis;
- zoom hacia el nombre de La Aldea;
- fundido;
- entrada en Aldea.

### Próximo bloque

Pendiente implementar la siguiente transición:

`La Aldea -> WorldMapScene -> Las Tierras del Fuego`

Requisito ya definido:

- volver a mostrar el mismo mapa;
- al pulsar una tecla/clic/toque iniciar zoom;
- el objetivo del zoom debe ser el texto **Las Tierras del Fuego**;
- al final del zoom el nombre debe quedar centrado.

## Organización de esta carpeta

### Base del proyecto

- `01-concepto-general.md`
- `02-personajes.md`
- `03-controles.md`
- `05-arquitectura-tecnica.md`
- `06-despliegue-github-pages.md`

### Inicio, personajes y presentación

- `06-pantalla-seleccion.md`
- `07-identidad-visual-y-controles-tactiles.md`
- `08-controles-tactiles.md`
- `09-tiana-sprite-in-game.md`
- `10-lupe-sprite-in-game.md`
- `11-intro-inicial.md`
- `21-estandar-animacion-personajes.md`

### HUD y sistemas compartidos

- `12-hud-y-sistemas-base.md`
- `13-game-over.md`
- `15-hud-layout.md`

### Zona de entrenamiento

- `04-area-entrenamiento.md`
- `14-zigzag-entrenamiento.md`
- `16-escala-visual-y-grid.md`
- `17-plano-grid-zona-entrenamiento.md`
- `18-refinado-suelos-entrenamiento.md`
- `19-distribucion-suelos-grid.md`
- `20-progreso-cabanas-y-portal.md`
- `23-interiores-cabanas-entrenamiento.md`

### Assets e interiores

- `22-estandar-laminas-assets-interior.md`
- `interior-grid-collisions.md`

### World Map y La Aldea

- `23-flujo-transicion-menu-dev-aldea-y-estandar-jugable.md`
- `24-aldea-npcs-y-cabanas.md`
- `grid-navigation-standard.md`

## Sobre la numeración histórica

Existen dos documentos con prefijo `06` y dos con prefijo `23`. Se mantienen sus nombres para no generar cambios de rutas innecesarios ni romper referencias históricas.

Desde ahora no se debe seguir la numeración antigua de forma ciega. Este índice es la navegación oficial y los documentos nuevos deben usar nombres descriptivos, o una numeración nueva solo si aporta valor.

## Regla de mantenimiento documental

Cuando cerremos un bloque funcional:

1. actualizar este documento si cambia el estado general;
2. actualizar el documento técnico específico;
3. no duplicar reglas ya consolidadas;
4. marcar como histórico cualquier documento que describa una implementación sustituida;
5. mantener `grid-navigation-standard.md` y `12-hud-y-sistemas-base.md` como estándares transversales.

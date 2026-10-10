# Arquitectura técnica actual

## Stack

- Phaser 4.2.1.
- TypeScript.
- Vite.
- GitHub.
- GitHub Actions.
- GitHub Pages.

## Render

Configuración principal:

- resolución física: 1920 × 1080;
- WebGL;
- antialias activado;
- `Phaser.Scale.FIT`;
- centrado automático.

El proyecto ya no sigue una estética pixel-art estricta. Los personajes, interiores, HUD y mapas usan ilustración 2D de mayor resolución y Phaser se encarga de escalarlos al tamaño de juego.

## Escenas registradas

Actualmente `src/main.ts` registra:

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

## Flujo principal actual

`Intro -> Selección -> ZE -> WorldMap -> La Aldea`

Desde La Aldea se puede entrar en tres cabañas y en la iglesia.

La siguiente transición prevista es:

`La Aldea -> WorldMap -> Las Tierras del Fuego`

## UI compartida

`src/playableSceneUi.ts` es la implementación común de HUD y controles para escenas jugables.

Incluye:

- nombre del personaje;
- barra de energía;
- monedas;
- texto contextual;
- icono de menú;
- cruceta táctil;
- botón de rayo;
- cámara UI independiente.

`TrainingScene` también utiliza ya esta UI compartida mediante `hdRenderingRefinement.ts`.

## Estado global de jugador

La energía y monedas deben sobrevivir a las transiciones entre escenas.

La transición ZE -> Aldea utiliza Phaser Registry y:

- `src/playerProgressBridge.ts`
- `src/villageProgress.ts`

No deben volver a inicializarse energía o monedas por el simple hecho de cambiar de escena.

## Navegación y colisiones

### Interiores

Modelo positivo de celdas jugables:

- `src/interiorGridCollision.ts`
- `src/interiorCollisionMaps.ts`
- `src/villageInteriorCollisionMaps.ts`
- `src/churchInteriorCollisionMap.ts`

### La Aldea

Modelo positivo de celdas jugables:

- `src/aldeaWalkableGrid.ts`
- `src/aldeaWalkableGridRefinement.ts`

La autoridad física para navegación es el **centro entre los pies**.

## Refinements

El proyecto contiene varios módulos `*Refinement.ts` que parchean o amplían escenas existentes sin reescribirlas por completo.

Son útiles durante la fase iterativa, pero cualquier refinement nuevo debe cumplir dos reglas:

1. no duplicar una lógica que ya tenga módulo compartido;
2. evitar parches que contradigan la fuente de verdad actual de navegación, HUD o progreso.

## Desarrollo y menú técnico

`src/devMode.ts` controla el modo técnico.

Con `DEV_MODE = true`, el icono de menú del HUD puede abrir `DevMenuScene` para saltar entre escenas durante las pruebas.

## Despliegue

Cada cambio en `main` dispara el workflow de GitHub Pages.

Antes de considerar una tarea cerrada deben comprobarse:

- compilación TypeScript;
- build Vite;
- despliegue de GitHub Pages;
- comportamiento real en navegador cuando el cambio afecte runtime.

## Documentación principal

El índice y estado vigente están en:

`docs/00-indice-y-estado-actual.md`

Normas transversales:

- `docs/12-hud-y-sistemas-base.md`
- `docs/grid-navigation-standard.md`
- `docs/interior-grid-collisions.md`

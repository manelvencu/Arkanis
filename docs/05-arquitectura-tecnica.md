# Arquitectura técnica inicial

## Stack

- Phaser 4.2.1
- TypeScript 7.0.2
- Vite 8.2.2
- GitHub como repositorio
- GitHub Pages como objetivo de publicación

## Estructura inicial

```text
Arkanis/
├── docs/
├── src/
│   ├── scenes/
│   │   ├── CharacterSelectScene.ts
│   │   └── TrainingScene.ts
│   ├── gameData.ts
│   ├── main.ts
│   └── style.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Flujo actual del prototipo

1. El juego arranca en una pantalla de selección de personaje.
2. Se puede escoger entre Tiana, Lupe, Manel y Cintia.
3. Los cuatro personajes comparten exactamente las mismas capacidades.
4. Tras elegir personaje se entra en el área de entrenamiento.
5. El personaje se mueve con las flechas del teclado.
6. La barra espaciadora lanza un rayo mágico en la última dirección de movimiento.
7. El escenario muestra carteles con los controles.
8. Hay una puerta provisional al final del área que representará la transición al primer mapa del mundo.

## Estado visual

Todos los gráficos actuales son provisionales y generados mediante formas simples de Phaser. Su único objetivo es validar mecánicas, controles y estructura antes de crear los sprites y mapas definitivos.

## Principio de desarrollo

Primero se validará que cada mecánica sea jugable y divertida. Después se sustituirán los elementos provisionales por arte pixel-art definitivo sin cambiar innecesariamente la lógica del juego.

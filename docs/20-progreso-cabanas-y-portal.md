# Progreso de cabañas y portal

## Objetivo

La Zona de entrenamiento dispone de tres cabañas accesibles. Cada una abre una escena interior independiente y, al salir, el jugador vuelve a la Zona de entrenamiento conservando el estado temporal de la visita.

## Cofres de las cabañas

Cada cabaña tiene un identificador estable de cofre:

- `training-cabin-1`
- `training-cabin-2`
- `training-cabin-3`

La lectura de un cofre se registra mediante `src/trainingProgress.ts` en `localStorage`, utilizando una lista de identificadores ya leídos.

La función `markTrainingChestRead(chestId)` es el punto de entrada utilizado por las escenas interiores cuando el jugador abre un cofre. La lectura es idempotente: volver a visitar una cabaña o volver a consultar un cofre ya leído no aumenta el progreso dos veces.

Los cofres utilizan los assets generales:

- `public/assets/environment/chest-closed-01.png`
- `public/assets/environment/chest-open-01.png`

Al volver a entrar en una cabaña cuyo cofre ya fue leído, el cofre aparece directamente abierto.

## Interiores implementados

Las tres cabañas comparten la misma distribución base en una habitación de 12 × 10 celdas lógicas (384 × 320 px):

- cama en la zona superior izquierda;
- cofre centrado en la zona superior;
- mesa en la zona superior derecha;
- puerta/salida centrada en la parte inferior;
- suelo y paredes dibujados directamente con Phaser;
- colisiones con paredes, cama, mesa y cofre;
- movimiento del personaje y controles táctiles.

Las escenas son:

- `src/scenes/CabinOneScene.ts`
- `src/scenes/CabinTwoScene.ts`
- `src/scenes/CabinThreeScene.ts`

La implementación visual y de movimiento compartida se concentra en `src/scenes/BaseTrainingCabinScene.ts` para que los ajustes futuros se propaguen a las tres cabañas.

## Textos de los cofres

### Cabaña 1

> En las tierras de Arkanis deberás ir pasando retos a los que debes enfrentarte sin miedo, para ello podrás disparar rayos, hechizos, podrás moverte, saltar y empujar objetos. Que tengas suerte!

### Cabaña 2

> Vas a iniciar un viaje por ocho mundos, cada cual más peligroso. En cada uno debes conseguir una pieza de la gran joya de Arkanis o no podrás continuar el viaje. Recuerda que tienes energía limitada, aléjate de los peligros.

### Cabaña 3

> Debes ser agradecido a los habitantes de los diferentes mundos y serás recompensado... O no.

## Transición entre exterior e interior

`src/cabinOneTransitionRefinement.ts` gestiona actualmente las tres entradas de las cabañas de la Zona de entrenamiento.

Al entrar:

- se detecta la puerta correspondiente por su posición exterior;
- se lanza `CabinOneScene`, `CabinTwoScene` o `CabinThreeScene`;
- `TrainingScene` queda dormida para conservar vasijas destruidas, monedas recogidas y el resto de estado temporal.

Al salir:

- se despierta `TrainingScene`;
- el personaje reaparece frente a la cabaña correspondiente;
- se vuelve a comprobar el progreso necesario para activar el portal.

## Condiciones del portal

El portal de salida está situado en `C35/F15` y permanece completamente invisible hasta que se cumplan simultáneamente:

- 10 de 10 vasijas destruidas;
- 17 de 17 monedas recogidas;
- 3 de 3 cofres leídos.

Cuando se cumplen las tres condiciones, el portal se hace visible y pasa a funcionar como salida del entrenamiento.

## Persistencia

Actualmente los cofres leídos se persisten en `localStorage`. Las vasijas destruidas y monedas recogidas se conservan mientras `TrainingScene` permanece dormida durante la visita a una cabaña, pero no están diseñadas todavía para sobrevivir a una recarga completa del navegador.

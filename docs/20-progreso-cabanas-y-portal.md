# Progreso de cabañas y portal

## Objetivo

La Zona de entrenamiento debe poder enviar al jugador a tres escenas interiores independientes, una por cabaña, y recuperar después el estado del entrenamiento sin perder qué cofres se han leído.

## Cofres de las cabañas

Cada cabaña tendrá un identificador estable de cofre. La lectura de un cofre se registrará mediante `src/trainingProgress.ts` en `localStorage`, utilizando una lista de identificadores ya leídos.

La función `markTrainingChestRead(chestId)` será el punto de entrada que utilizarán las futuras escenas interiores cuando el jugador complete la lectura de su cofre. La lectura es idempotente: volver a leer el mismo cofre no aumenta el progreso dos veces.

## Regreso a la Zona de entrenamiento

Para conservar también el estado temporal de las vasijas destruidas y las monedas recogidas durante una visita a una cabaña, la transición prevista será dormir o pausar `TrainingScene` mientras se abre la escena interior y despertarla o reanudarla al salir.

De este modo:

- las vasijas destruidas y monedas recogidas permanecen en memoria durante la visita interior;
- los cofres leídos quedan además persistidos en `localStorage`;
- al volver a la Zona de entrenamiento se vuelve a comprobar si ya se cumplen todos los requisitos del portal.

Si en el futuro se decide que vasijas y monedas también deban sobrevivir a una recarga completa del navegador, se ampliará el mismo estado persistente para incluirlas.

## Condiciones del portal

El portal de salida está situado en `C35/F15` y permanece completamente invisible hasta que se cumplan simultáneamente:

- 10 de 10 vasijas destruidas;
- 17 de 17 monedas recogidas;
- 3 de 3 cofres leídos.

Cuando se cumplen las tres condiciones, el portal se hace visible y pasa a funcionar como salida del entrenamiento.

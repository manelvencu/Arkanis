# Interiores de las cabañas de entrenamiento

## Alcance

Este documento recoge la implementación funcional de las tres cabañas accesibles desde la Zona de entrenamiento.

La intención de esta primera versión es mantener interiores sencillos, claros y coherentes, evitando llenar las habitaciones con decoración innecesaria.

## Medidas y distribución

Cada interior utiliza una superficie lógica de 12 × 10 celdas de 32 px:

- ancho: 384 px;
- alto: 320 px;
- personaje mostrado aproximadamente a 64 × 64 px;
- cámara centrada en la habitación, sin desplazamiento del mapa interior.

Distribución común:

```text
┌────────────────────────┐
│ CAMA      COFRE   MESA │
│                        │
│                        │
│                        │
│                        │
│                        │
│                        │
│                        │
│         PUERTA         │
└────────────────────────┘
```

El suelo y las paredes se dibujan directamente con Phaser. Los muebles utilizan los assets ya preparados dentro de `public/assets/environment/interiors/cabin/`.

## Assets utilizados

Mobiliario principal:

- `bed-single-01.png`
- `table-main-01.png`

Cofre interactivo:

- `public/assets/environment/chest-closed-01.png`
- `public/assets/environment/chest-open-01.png`

Los interiores reutilizan los sprites de movimiento existentes de Tiana y Lupe.

## Arquitectura de escenas

La lógica común vive en:

- `src/scenes/CabinInteriorScene.ts`

Escenas concretas:

- `CabinOneScene`
- `CabinTwoScene`
- `CabinThreeScene`

Cada escena concreta define únicamente su clave, identificador de cofre, texto narrativo y punto exterior de retorno.

Esto permite mantener idénticos el aspecto, las colisiones y el comportamiento de las tres cabañas.

## Cofres

Cada cofre se abre automáticamente al aproximarse suficientemente el personaje. En la primera lectura:

1. cambia de textura cerrada a abierta;
2. se registra su identificador con `markTrainingChestRead()`;
3. aparece el cuadro de texto correspondiente;
4. el movimiento queda detenido mientras el cuadro está abierto.

Si el identificador ya existe en `localStorage`, el cofre aparece abierto desde el inicio de la escena y no vuelve a incrementar el progreso.

El mensaje, sin embargo, es siempre reutilizable. Si el jugador se aleja del cofre y vuelve a acercarse, el texto vuelve a mostrarse aunque el cofre ya esté abierto. Permanecer junto al cofre después de cerrar el mensaje no lo vuelve a abrir continuamente: es necesario salir de su zona de proximidad y entrar de nuevo.

Identificadores:

- Cabaña 1: `training-cabin-1`
- Cabaña 2: `training-cabin-2`
- Cabaña 3: `training-cabin-3`

## Mensajes definitivos

Cabaña 1:

> En las tierras de Arkanis deberás ir pasando retos a los que debes enfrentarte sin miedo, para ello podrás disparar rayos, hechizos, podrás moverte, saltar y empujar objetos. Que tengas suerte!

Cabaña 2:

> Vas a iniciar un viaje por ocho mundos, cada cual más peligroso. En cada uno debes conseguir una pieza de la gran joya de Arkanis o no podrás continuar el viaje. Recuerda que tienes energía limitada, aléjate de los peligros.

Cabaña 3:

> Debes ser agradecido a los habitantes de los diferentes mundos y serás recompensado... O no.

## Entrada y regreso

La Zona de entrenamiento mantiene tres cabañas colocadas sobre la cuadrícula exterior, con puntos de apoyo:

- primera cabaña: `C12/F09`;
- segunda cabaña: `C22/F09`;
- tercera cabaña: `C32/F09`.

La transición se controla mediante `src/cabinOneTransitionRefinement.ts`, que pese a conservar su nombre histórico gestiona actualmente las tres cabañas.

La entrada ya no se activa antes de alcanzar visualmente la puerta. Para entrar, el personaje debe avanzar hacia arriba dentro de la celda de puerta correspondiente:

- Cabaña 1: `C12/F10`;
- Cabaña 2: `C22/F10`;
- Cabaña 3: `C32/F10`.

Al entrar se duerme `TrainingScene` y se lanza la escena interior correspondiente. Al salir se detiene el interior, se despierta `TrainingScene` y el personaje reaparece centrado en la fila `F12`, manteniendo la columna de su cabaña:

- Cabaña 1: `C12/F12`;
- Cabaña 2: `C22/F12`;
- Cabaña 3: `C32/F12`.

## Relación con el portal

Los tres cofres forman parte de las condiciones de finalización de la Zona de entrenamiento. El portal de `C35/F15` solo aparece cuando se cumplen a la vez:

- 10 vasijas destruidas;
- 17 monedas recogidas;
- 3 cofres leídos.

## Assets de interiores

La lámina de origen de mobiliario se normalizó al estándar técnico de Arkanis:

- 1280 × 1280 px;
- cuadrícula 4 × 4;
- 320 × 320 px por celda;
- margen de seguridad aproximado de 30 px;
- fondo transparente.

El workflow `split-interior-assets.yml` divide automáticamente la lámina de origen en los 16 PNG de `public/assets/environment/interiors/cabin/`.

El estándar completo de láminas está documentado en `docs/22-estandar-laminas-assets-interior.md`.

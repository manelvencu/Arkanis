# Aldea: NPC, diálogos y cabañas

## Animación de personajes y NPC

La Aldea debe respetar el estándar general de animación de personajes definido para el juego.

- Derecha: `walk-right-01 -> idle-right -> walk-right-02 -> idle-right -> ...`.
- Izquierda: reutiliza exactamente la animación de derecha con espejo horizontal (`flipX`).
- Arriba: alterna `walk-up-01 -> walk-up-02` y al detenerse usa `idle-up`.
- Abajo: alterna `walk-down-01 -> walk-down-02` y al detenerse usa `idle-down`.
- El mismo criterio se aplica tanto a Tiana/Lupe como a los NPC móviles.

## NPC móviles de la Aldea

Se reutilizan y pueden replicarse los dos NPC disponibles en `public/assets/characters/npcs/`:

- `npc-boy-explorer...`
- `npc-girl-braids...`

Los NPC siguen un ciclo autónomo:

`DENTRO -> SALE -> CAMINA -> ENTRA -> ESPERA -> SALE`

Al entrar en una cabaña desaparecen visualmente y permanecen dentro un mínimo de **5 segundos** antes de volver a salir. El siguiente destino se elige aleatoriamente entre las otras cabañas.

Al acercarse el jugador a un NPC que está caminando, el NPC se detiene. Los mensajes forman una secuencia global, independiente del NPC concreto:

1. `Hay ocho mundos que deberás ir visitando. En cada uno deberás conseguir un fragmento de la Joya de Arkanis.`
2. `Cuando reúnas los ocho fragmentos de la Joya de Arkanis, los tienes que llevar a la torre más alta del Castillo de Arkanis.`
3. `¡Toma explorador! Aquí debes colocar todos los fragmentos de la Joya de Arkanis.`

Después del tercer mensaje ningún NPC vuelve a mostrar texto. El tercer diálogo deja registrado que el jugador ha recibido el futuro **portaobjetos para los fragmentos**. Su imagen y presentación visual quedan pendientes de crear y definir; cuando exista el asset, se mostrará en ese punto.

## Cabañas jugables

### Cabaña de las monedas

Reutiliza el estilo de interior de la zona de entrenamiento. Contiene **10 monedas** repartidas por la habitación. Cada moneda solo puede recogerse una vez y se suma al contador global de la Aldea.

### Cabaña del vino

Contiene un barril de vino y el NPC niño estático junto a él. Al acercarse al barril se muestra:

`Toma de nuestro vino y retoma fuerzas para el camino`

Si la energía es inferior al 100 %, se restaura al 100 % y se muestra un efecto visual llamativo asociado a la recuperación de energía.

### Cabaña de la pareja

Contiene al NPC niño y al NPC niña estáticos. Al entrar se muestra:

`Te deseamos el mejor de los caminos y que la suerte te acompañe.`

## Estado compartido de la Aldea

El progreso de la Aldea mantiene:

- índice del siguiente mensaje de NPC;
- entrega del futuro portaobjetos;
- monedas recogidas;
- energía actual;
- monedas de la cabaña ya recogidas.

Así el jugador conserva estos datos al entrar y salir de las cabañas.

## Mapa del mundo

El zoom de entrada hacia La Aldea se mantiene. No debe mostrarse ningún círculo amarillo, pulso o destello circular sobre el mapa.

## GAME OVER

La pantalla de GAME OVER se considera interfaz de pantalla y debe permanecer centrada respecto a la resolución física del juego, sin depender del scroll ni del zoom de la cámara de la zona de entrenamiento.

## Fuente de la plaza

Pendiente de asset. Se integrará como animación de cuatro PNG transparentes cuando estén disponibles los cuatro frames de la fuente.

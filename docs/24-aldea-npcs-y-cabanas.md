# La Aldea — estado jugable actual

## Papel de La Aldea

La Aldea es la primera zona jugable después de la Zona de Entrenamiento y de la transición por el mapa del mundo.

Funciona como espacio de exploración, interacción con NPC y acceso a interiores.

## Estado global

Al entrar desde ZE deben conservarse:

- energía;
- monedas.

La sincronización usa Phaser Registry y `src/playerProgressBridge.ts`.

Entrar y salir de interiores tampoco debe reiniciar estos valores.

## Navegación exterior

La Aldea usa una whitelist positiva de celdas jugables.

- grid: 30 × 22;
- celda: 32 × 32 px;
- mundo lógico: 960 × 704 px;
- autoridad: centro entre los pies;
- offset de referencia exterior: aproximadamente +20 px.

Fuente de verdad:

- `src/aldeaWalkableGrid.ts`
- `src/aldeaWalkableGridRefinement.ts`

Todo lo no declarado como jugable está bloqueado.

Los antiguos blockers físicos no deben contradecir una celda permitida por la whitelist.

## Entradas exactas

Toda celda de entrada se añade automáticamente al conjunto jugable.

La transición exige:

1. centro entre los pies dentro de la celda;
2. intención de caminar hacia arriba;
3. ninguna otra transición activa.

Entradas:

### Iglesia

- `C18F7`
- `C19F7`

### Cabaña derecha superior / blessing

- `C26F13`

### Tienda de vino / wine

- `C22F19`
- `C22F20`

### Cabaña inferior izquierda / coins

- `C5F18`
- `C5F19`

## NPC móviles

La Aldea reutiliza NPC niño y niña.

Los NPC pueden:

- salir de una construcción;
- recorrer la Aldea;
- entrar en otra;
- permanecer dentro;
- volver a salir.

Cuando el jugador se aproxima, el NPC se detiene y puede mostrar el siguiente diálogo global disponible.

Los diálogos de NPC son **UI contextual centrada en la pantalla visible**. No se posicionan respecto al NPC ni al jugador, de modo que nunca deben quedar cortados al hablar cerca de los bordes superior, inferior o laterales de la cámara.

La secuencia narrativa actual introduce:

- los ocho mundos;
- los ocho fragmentos de la Joya de Arkanis;
- el objetivo de llevarlos al Castillo de Arkanis;
- el futuro portaobjetos de fragmentos.

## Cabaña de monedas

`kind: coins`

Interior visual:

`public/assets/environment/interiors/cabin/cabin-interior-furnished-01.png`

Contiene 10 monedas.

Las monedas ya recogidas deben permanecer registradas para no reaparecer al volver a entrar.

Zona jugable definida en `src/villageInteriorCollisionMaps.ts`.

## Tienda de vino

`kind: wine`

Interior visual:

`public/assets/environment/interiors/cabin/cabin-interior-wine-shop-01.png`

Incluye NPC y recuperación de energía.

Mensaje:

> Toma de nuestro vino y retoma fuerzas para el camino

Zona jugable definida y validada en `src/villageInteriorCollisionMaps.ts`.

El pasillo de salida incluye F15 C14–C17.

## Cabaña de bendición

`kind: blessing`

Interior visual:

`public/assets/environment/interiors/cabin/cabin-interior-furnished-02.png`

Incluye NPC niño y niña.

Mensaje:

> Te deseamos el mejor de los caminos y que la suerte te acompañe.

Zona jugable definida y validada en `src/villageInteriorCollisionMaps.ts`.

## Iglesia

Interior visual:

`public/assets/environment/interiors/church/church-interior-furnished-01.png`

La zona jugable es exclusivamente el pasillo central:

`F8C14 a F15C17`

Definición:

`src/churchInteriorCollisionMap.ts`

## Grid visual

Las plantillas visuales de grid utilizadas para definir las cabañas, la iglesia y **La Aldea exterior** ya fueron retiradas.

Las colisiones continúan funcionando porque el grid visible nunca fue la colisión real. La navegación exterior sigue dependiendo de la whitelist de `src/aldeaWalkableGrid.ts`.

## HUD

La Aldea y sus interiores usan el HUD común de:

`src/playableSceneUi.ts`

No deben crear barras de energía, contadores o controles propios.

## Siguiente transición

La próxima salida narrativa de La Aldea debe volver a mostrar el mapa general de Arkanis.

Al recibir una pulsación/clic/toque se realizará zoom hacia **Las Tierras del Fuego**, terminando con el nombre de esa zona centrado antes de continuar al siguiente nivel.

Esta transición está definida como próximo bloque de trabajo, no como funcionalidad cerrada.

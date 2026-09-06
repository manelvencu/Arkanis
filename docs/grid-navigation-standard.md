# Estándar de navegación por grid, límites y entradas

Este documento define el criterio común que se debe usar en Arkanis para delimitar zonas jugables, medir la posición del personaje y definir entradas a construcciones.

## Principio general

La navegación se define mediante una **whitelist de celdas jugables**.

- Una celda es no jugable por defecto.
- Solo las celdas o rangos declarados expresamente como jugables pueden ser pisados.
- No se deben crear límites mediante parches separados por cada lado de una pared o edificio.
- La rejilla visual es únicamente una herramienta de edición y comprobación; no forma parte de la colisión real.

## Punto de referencia del personaje

La posición que manda para saber si el personaje puede o no puede estar en una celda es el **centro entre los pies**.

No se usa:

- el centro visual del sprite;
- la cabeza;
- los hombros;
- el ancho completo del personaje.

Esto permite conservar correctamente la perspectiva: el cuerpo puede solaparse visualmente con muebles, paredes o fachadas, pero el punto de apoyo de los pies nunca puede entrar en una celda no jugable.

### Offset actual

- Interiores: el punto de pies se calcula aproximadamente a `+25 px` respecto al centro lógico del sprite.
- La Aldea exterior: la escena base usa aproximadamente `+20 px` respecto al centro lógico del sprite.

Si en el futuro cambia el arte o el tamaño del personaje, debe mantenerse el concepto de **centro entre los pies** aunque se ajuste el offset técnico.

## Cómo definir una zona jugable

Se debe indicar únicamente el área permitida, usando coordenadas de fila y columna.

Ejemplo:

```text
F6C9 a F6C25
F7C9 a F7C23
F8C8 a F8C23
```

Todo lo que no esté incluido queda automáticamente no jugable.

## Interiores

Los interiores actuales usan:

- tamaño lógico: `960 x 540 px`;
- 30 columnas;
- 15 filas;
- ancho de celda: `32 px`;
- alto de celda: `36 px`.

La lógica reutilizable está en:

- `src/interiorGridCollision.ts`
- `src/interiorCollisionMaps.ts`
- `src/villageInteriorCollisionMaps.ts`
- `src/churchInteriorCollisionMap.ts`

La documentación específica de interiores está en:

- `docs/interior-grid-collisions.md`

## La Aldea exterior

La Aldea usa su grid natural de `32 px`:

- 30 columnas;
- 22 filas;
- tamaño total: `960 x 704 px`.

La zona jugable exterior se define también como whitelist de celdas.

La definición actual está centralizada en:

- `src/aldeaWalkableGrid.ts`

La integración con `AldeaScene` está en:

- `src/aldeaWalkableGridRefinement.ts`

## Entradas a construcciones

Las entradas deben definirse mediante **celdas exactas de entrada** y no mediante una distancia aproximada a la puerta.

La entrada se dispara cuando:

1. el centro entre los pies está dentro de una de las celdas declaradas como entrada;
2. el personaje se mueve en la dirección adecuada hacia la construcción;
3. no hay ya otra transición activa.

Para construcciones con puerta en la parte inferior de la fachada, la dirección habitual de entrada es **hacia arriba**.

Ejemplo:

```text
Entrada iglesia:
C18F7
C19F7
```

Ambas celdas pueden formar parte también del área jugable normal.

## Entradas actuales de La Aldea

Las entradas actualmente definidas son:

```text
Iglesia:
C18F7
C19F7

Cabaña derecha superior:
C26F13

Tienda de vino:
C22F19
C22F20

Cabaña inferior izquierda:
C5F18
C5F19
```

La regla es siempre la misma: **la celda de entrada se mide con el centro entre los pies**.

## Salidas y conexiones entre mapas

Las zonas que conectan con otro mapa se definen igualmente por celdas jugables y, cuando corresponda, por una zona de transición específica.

La transición no debe depender de que el cuerpo completo del personaje atraviese una pared o un límite visual. Debe activarse cuando el punto de pies alcance la zona de transición prevista.

## Movimiento y límites

El comportamiento esperado es:

- el personaje puede desplazarse libremente dentro de las celdas jugables;
- no puede introducir el punto de pies en una celda no jugable;
- al moverse en diagonal contra un límite debe poder deslizarse por el eje libre;
- nunca debe atravesar una celda no jugable por velocidad, lag o cambio de dirección.

## Flujo recomendado para nuevos mapas

1. Mostrar una rejilla visual temporal.
2. Recorrer el mapa tomando siempre como referencia el centro entre los pies.
3. Anotar solo las celdas o rangos jugables.
4. Marcar aparte las celdas exactas de entrada o transición.
5. Implementar la whitelist de celdas.
6. Probar bordes desde todas las direcciones y en diagonal.
7. Probar cada entrada desde su aproximación natural.
8. Quitar la rejilla visual cuando el mapa esté validado.

## Qué no hacer

- No usar el centro visual del personaje como referencia de suelo.
- No definir el mapa principalmente mediante una colección creciente de bloqueos.
- No usar radios de proximidad grandes para entrar en edificios cuando existe una celda de entrada exacta.
- No hacer depender la entrada de penetrar físicamente en la fachada.
- No usar la imagen de la rejilla como sistema de colisión.
- No duplicar mapas idénticos si pueden reutilizar la misma definición.

## Convención para futuras definiciones

Cuando se pida al usuario definir un mapa, la petición estándar será:

```text
Zona jugable:
F...C... a F...C...

Entradas:
Construcción X: C...F...
```

Siempre se entenderá que la medida se realiza con el **centro entre los pies del personaje** y que todo lo no declarado como jugable queda bloqueado.

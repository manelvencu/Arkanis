# Estándar de colisiones por grid en interiores

Este documento define cómo deben construirse a partir de ahora las colisiones de cabañas, tiendas, iglesias y cualquier interior similar de Arkanis.

## Principio principal

La rejilla visual y la colisión son dos cosas distintas.

- La rejilla visible sirve únicamente para marcar y revisar celdas.
- La colisión real se guarda como datos de **área jugable**.
- Por defecto, una celda es **NO JUGABLE**.
- Solo las celdas declaradas expresamente como jugables pueden ser pisadas.
- No se deben crear parches independientes para izquierda, derecha, arriba o abajo.

Esta es la convención preferida para todos los interiores nuevos.

## Grid estándar actual

Los interiores actuales usan:

- Tamaño lógico: 960 x 540 px.
- 30 columnas: C1 a C30.
- 15 filas: F1 a F15.
- Ancho de celda: 32 px.
- Alto de celda: 36 px.

La guía visual puede ocultarse con G sin alterar las colisiones.

## Punto de referencia del personaje

La autoridad de movimiento es un único punto: **el centro entre los pies del personaje**.

Al definir un mapa no hay que pensar en la cabeza, hombros ni anchura visual del sprite. Es normal que, por perspectiva, parte del personaje pueda solaparse visualmente con una cama, mesa o pared. Lo que nunca puede ocurrir es que el punto central entre sus pies entre en una celda no jugable.

En las escenas actuales ese punto se calcula con un desplazamiento vertical de +25 px desde el centro lógico del sprite.

## Cómo se define el área jugable

Las zonas jugables se expresan mediante rangos inclusivos de celdas:

```ts
cellRange(9, 6, 26, 6)    // F6C9 a F6C26
cellRange(5, 9, 23, 10)   // F9-F10, C5-C23
cellRange(14, 13, 17, 15) // pasillo de salida F13-F15, C14-C17
```

**Todo lo que no aparezca en esos rangos queda automáticamente prohibido.**

Los mapas están centralizados en:

`src/interiorCollisionMaps.ts`

El motor reutilizable está en:

`src/interiorGridCollision.ts`

## Regla de movimiento

No confiamos en que Arcade Physics empuje al personaje fuera de rectángulos físicos.

Antes de aplicar cada desplazamiento:

1. Se calcula la nueva posición propuesta.
2. Se calcula el punto central entre los pies.
3. Se obtiene la celda del grid que contiene ese punto.
4. Si esa celda no está declarada como jugable, ese componente del desplazamiento no se aplica.
5. El movimiento diagonal se resuelve por ejes, permitiendo deslizarse por una pared sin atravesarla.
6. Cada frame se divide internamente en pasos de máximo 4 px para evitar saltarse una celda por velocidad alta o lag.

Por tanto, una celda no jugable no puede pisarse ni atravesarse lateralmente, perpendicularmente ni en diagonal.

## Velocidad de movimiento en interiores

La velocidad actual de referencia para estas cabañas es de **135 px/s**.

El movimiento se calcula con `delta`, por lo que la velocidad no depende de los FPS. Si en el futuro se ajusta la sensación de movimiento, debe modificarse la constante común de velocidad del interior y no añadir multiplicadores distintos por cabaña.

## Flujo para crear un nuevo interior

1. Crear o reutilizar el fondo 960 x 540.
2. Mostrar la guía 30 x 15.
3. Recorrer visualmente la habitación tomando siempre como referencia el **centro entre los pies**.
4. Anotar únicamente las celdas o rangos JUGABLES.
5. Añadir esos rangos al mapa del interior.
6. Todo el resto queda no jugable automáticamente.
7. Probar los bordes desde los cuatro lados y en diagonal.
8. Ocultar la guía y repetir una prueba rápida: el comportamiento debe ser idéntico.

## Formato recomendado al definir una habitación

Ejemplo:

```text
Área jugable:
F6C9 a F6C26
F7C9 a F8C23
F9C5 a F10C23
F11C5 a F11C26
F12C6 a F12C26
F13C14 a F15C17

Todo lo demás no es jugable.
```

Ese formato es suficiente para construir el mapa.

## Caso validado: Cabaña 1 y Cabaña 3 de ZE

Cabaña 1 y Cabaña 3 comparten la misma distribución visual y reutilizan exactamente el mismo mapa jugable:

```text
F6C9 a F6C26
F7C9 a F7C23
F8C9 a F8C23
F9C5 a F9C23
F10C5 a F10C23
F11C5 a F11C26
F12C6 a F12C26
F13C14 a F13C17
F14C14 a F14C17
F15C14 a F15C17
```

Todo lo demás es no jugable.

Este caso se considera la referencia validada para futuros interiores con requisitos equivalentes.

## Qué no hacer

- No definir primero todo como jugable y después intentar cerrar decenas de zonas con parches.
- No crear un collider distinto para cada lado de una pared.
- No añadir límites X/Y manuales específicos para corregir una fuga.
- No depender de rectángulos Arcade solapados para representar las celdas no jugables.
- No usar la imagen de la rejilla como sistema de colisión.
- No usar el centro visual del personaje como referencia de suelo.

## Compatibilidad temporal

Algunos interiores anteriores pueden conservar durante la migración una lista de celdas bloqueadas. El motor puede convertir temporalmente ese formato a celdas permitidas, pero los interiores nuevos y los que vayamos afinando deben pasar al modelo positivo de **área jugable**.

## Reutilización

Si dos interiores usan exactamente la misma distribución, deben reutilizar el mismo conjunto de rangos, no copiar dos listas independientes. Así cualquier corrección futura se aplica a ambos automáticamente.

Cabaña 1 y Cabaña 3 de ZE ya siguen este criterio compartiendo el mismo conjunto `CABIN_ONE_WALKABLE` en `src/interiorCollisionMaps.ts`.

Cuando definamos las cabañas de La Aldea, la tienda de vino, la iglesia y futuros interiores, deben incorporarse a este mismo sistema de datos y validación.

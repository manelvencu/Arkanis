# Estándar de colisiones por grid en interiores

Este documento define cómo deben construirse a partir de ahora las colisiones de cabañas, tiendas, iglesias y cualquier interior similar de Arkanis.

## Principio principal

La rejilla visual y la colisión son dos cosas distintas.

- La rejilla visible sirve únicamente para marcar y revisar celdas.
- La colisión real se guarda como datos de celdas bloqueadas.
- Una celda bloqueada es **no jugable**: los pies del personaje no pueden entrar en ella desde ninguna dirección.
- No se deben crear parches independientes para izquierda, derecha, arriba o abajo.

## Grid estándar actual

Los interiores actuales usan:

- Tamaño lógico: 960 x 540 px.
- 30 columnas: C1 a C30.
- 15 filas: F1 a F15.
- Ancho de celda: 32 px.
- Alto de celda: 36 px.

La guía visual puede ocultarse con G sin alterar las colisiones.

## Cómo se define una zona bloqueada

Las zonas se expresan mediante rangos inclusivos de celdas:

```ts
cellRange(1, 1, 30, 4)   // F1-F4 completas
cellRange(5, 6, 8, 8)    // C5-C8, F6-F8
cellRange(1, 13, 13, 15) // parte izquierda de F13-F15
```

Los mapas actuales de las cabañas de ZE están centralizados en:

`src/interiorCollisionMaps.ts`

El motor reutilizable está en:

`src/interiorGridCollision.ts`

## Regla de movimiento

No confiamos en que Arcade Physics empuje al personaje fuera de rectángulos físicos.

Antes de aplicar cada desplazamiento:

1. Se calcula la nueva posición propuesta.
2. Se calcula la huella de los pies del personaje.
3. Se comprueban todas las celdas que tocaría esa huella.
4. Si alguna está bloqueada, ese desplazamiento no se aplica.
5. El movimiento diagonal se resuelve por ejes, permitiendo deslizarse por una pared sin atravesarla.
6. Cada frame se divide internamente en pasos de máximo 4 px para evitar atravesar una celda por velocidad alta o lag.

Por tanto, una celda bloqueada no se puede atravesar lateralmente, perpendicularmente ni en diagonal.

## Huella del personaje

Para interiores se usa una huella lógica centrada en los pies, no todo el sprite:

- ancho: 30 px;
- alto: 18 px;
- desplazamiento vertical respecto al centro del sprite: +25 px.

Esto permite que la parte visual superior del personaje pueda solaparse con mobiliario en perspectiva, mientras sus pies siguen respetando el suelo jugable.

## Flujo para crear un nuevo interior

1. Crear o reutilizar el fondo 960 x 540.
2. Mostrar la guía 30 x 15.
3. Recorrer visualmente la habitación tomando siempre como referencia los pies del personaje.
4. Anotar las celdas o rangos no jugables.
5. Añadir esos rangos al mapa de colisión del interior.
6. Mantener libres expresamente puertas, pasillos y zonas de interacción.
7. Probar entrada desde los cuatro lados y en diagonal.
8. Ocultar la guía y repetir una prueba rápida: la colisión debe ser idéntica.

## Qué no hacer

- No crear un collider distinto para cada lado de una pared.
- No añadir límites X/Y manuales específicos para corregir una fuga.
- No depender de rectángulos Arcade solapados para representar las celdas no jugables.
- No usar la imagen de la rejilla como sistema de colisión.
- No modificar el tamaño de la huella por habitación salvo que exista una razón de diseño documentada.

## Reutilización

Si dos interiores usan exactamente la misma distribución, deben reutilizar el mismo conjunto de rangos, como hacen actualmente Cabaña 1 y Cabaña 3 de ZE.

Cuando empecemos a definir las cabañas de La Aldea, la tienda de vino y la iglesia, deben incorporarse al mismo sistema de datos y validación, no crear sistemas de colisión nuevos por escena.

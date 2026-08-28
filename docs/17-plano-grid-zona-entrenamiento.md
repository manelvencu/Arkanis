# Plano grid - Zona de entrenamiento

## Base

La Zona de entrenamiento se revisa sobre un grid de **45 columnas × 28 filas**, con celdas de **32×32 px**. El mundo lógico queda en **1440×896 px**.

La superposición visible identifica cada celda con el formato `Cxx/Fxx`.

Para los elementos todavía no refinados, este documento sigue registrando la celda aproximada en la que cae su centro visual. Para objetos grandes ya refinados, como árboles y cabañas, la referencia pasa a ser su **punto de apoyo físico** sobre el grid. En elementos pequeños refinados, como pinchos, monedas y vasijas, la referencia es el centro exacto de su celda.

## Terreno actual

- Césped superior: `C01/F01` a `C45/F05`.
- Explanada de tierra: `C05/F06` a `C37/F24`.
- Camino hacia la barrera: aproximadamente desde `C34/F04` hasta `C39/F15`.

## Puntos principales

| Elemento | Celda de referencia |
| --- | --- |
| Spawn del jugador | `C21/F15` |
| Portal de salida | `C35/F15` |
| Cabaña 1 — punto de apoyo | `C12/F09` |
| Cabaña 2 — punto de apoyo | `C22/F09` |
| Cabaña 3 — punto de apoyo | `C32/F09` |

El portal permanece invisible hasta completar todos los objetivos del entrenamiento.

Las tres cabañas mantienen su tamaño visual de **270×205 px** y su cuerpo de colisión de **220×92 px**. Solo se reajustan ligeramente para que el centro de su base física quede alineado con el grid. Sus puntos de apoyo exactos son `(368,272)`, `(688,272)` y `(1008,272)`.

## Vasijas

Centros exactos refinados al grid:

`C08/F13`, `C14/F16`, `C19/F13`, `C25/F16`, `C30/F14`, `C34/F17`, `C10/F18`, `C31/F19`, `C36/F22`, `C38/F11`.

## Rocas

`C06/F10`, `C40/F13`, `C08/F20`, `C33/F21`, `C41/F18`, `C15/F23`.

## Arbustos

`C06/F06`, `C10/F06`, `C32/F05`, `C41/F06`, `C05/F23`, `C35/F23`, `C41/F22`.

## Árboles

Los cinco árboles refinados utilizan punto de apoyo en:

`C05/F05`, `C13/F05`, `C21/F05`, `C29/F05`, `C37/F05`.

## Recorrido de pinchos

Centros exactos refinados al grid. Las dos barreras horizontales principales quedan ahora en `F21` y `F24`, con `F22` y `F23` libres entre ambas para dar más espacio de paso al personaje:

`C11/F21`, `C13/F21`, `C16/F21`, `C18/F21`, `C20/F21`, `C22/F21`, `C24/F21`, `C26/F21`, `C34/F21`,
`C11/F22`, `C34/F22`,
`C18/F24`, `C20/F24`, `C22/F24`, `C24/F24`, `C26/F24`, `C28/F24`, `C30/F24`, `C32/F24`,
`C11/F25`, `C33/F26`.

## Monedas del zigzag

Centros base exactos refinados al grid:

`C12/F20`, `C15/F20`, `C19/F20`, `C22/F20`, `C26/F20`, `C29/F20`,
`C31/F23`, `C29/F23`, `C26/F23`, `C22/F23`, `C19/F23`, `C15/F23`,
`C13/F25`, `C17/F26`, `C21/F26`, `C25/F26`, `C29/F26`.

La animación de flotación de las monedas puede desplazarlas visualmente unos píxeles en vertical, pero su posición base y su referencia lógica permanecen en el centro de las celdas anteriores.

## Siguiente fase

Con este plano visible iremos corrigiendo el mapa por bloques. Para cada tipo de elemento se fijará primero su tamaño visual oficial y su huella lógica; después se recolocarán los objetos sobre celdas concretas del grid.

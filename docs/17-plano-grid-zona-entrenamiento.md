# Plano grid - Zona de entrenamiento

## Base

La Zona de entrenamiento se revisa sobre un grid de **45 columnas × 28 filas**, con celdas de **32×32 px**. El mundo lógico queda en **1440×896 px**.

La superposición visible identifica cada celda con el formato `Cxx/Fxx`.

Este documento registra dónde cae actualmente el **centro** de cada objeto existente. Todavía no significa que el objeto esté correctamente alineado al grid: árboles, cabañas y otros sprites grandes ocupan visualmente varias celdas alrededor de su centro. Precisamente utilizaremos este plano para decidir después sus huellas y posiciones definitivas.

## Terreno actual

- Césped: cubre el mundo completo.
- Explanada de tierra: aproximadamente desde `C05/F06` hasta `C38/F25`.
- Camino hacia la barrera: aproximadamente desde `C34/F04` hasta `C39/F15`.

## Puntos principales

| Elemento | Celda actual aproximada |
| --- | --- |
| Spawn del jugador | `C21/F15` |
| Barrera mágica | `C37/F05` |
| Cabaña 1 | `C12/F08` |
| Cabaña 2 | `C22/F07` |
| Cabaña 3 | `C32/F07` |

## Vasijas

`C08/F13`, `C14/F16`, `C19/F13`, `C25/F16`, `C30/F14`, `C34/F17`, `C10/F18`, `C31/F19`, `C36/F22`, `C38/F11`.

## Rocas

`C06/F10`, `C40/F13`, `C08/F20`, `C33/F21`, `C41/F18`, `C15/F23`.

## Arbustos

`C06/F06`, `C10/F06`, `C32/F05`, `C41/F06`, `C05/F23`, `C35/F23`, `C41/F22`.

## Árboles

Borde superior: `C03/F04`, `C08/F03`, `C13/F03`, `C18/F03`, `C23/F03`, `C29/F03`, `C43/F04`.

Borde inferior: `C03/F26`, `C08/F26`, `C14/F26`, `C20/F26`, `C26/F26`, `C31/F26`, `C38/F26`, `C43/F26`.

Laterales: `C03/F09`, `C03/F15`, `C03/F21`, `C43/F09`, `C43/F15`, `C43/F21`.

## Recorrido de pinchos

Centros actuales aproximados:

`C11/F21`, `C13/F21`, `C16/F21`, `C18/F21`, `C20/F21`, `C22/F21`, `C24/F21`, `C26/F21`, `C34/F21`,
`C11/F22`, `C34/F22`,
`C18/F23`, `C20/F23`, `C22/F23`, `C24/F23`, `C26/F23`, `C28/F23`, `C30/F23`, `C32/F23`,
`C11/F24`, `C33/F25`.

## Monedas del zigzag

`C12/F20`, `C15/F20`, `C19/F20`, `C22/F20`, `C26/F20`, `C29/F20`,
`C31/F22`, `C29/F22`, `C26/F22`, `C22/F22`, `C19/F22`, `C15/F22`,
`C13/F24`, `C17/F25`, `C21/F25`, `C25/F25`, `C29/F25`.

## Siguiente fase

Con este plano visible iremos corrigiendo el mapa por bloques. Para cada tipo de elemento se fijará primero su tamaño visual oficial y su huella lógica; después se recolocarán los objetos sobre celdas concretas del grid.

# Refinado de suelos del entrenamiento

## Criterio de trabajo

La corrección visual del escenario se realizará de arriba a abajo utilizando el grid lógico de 32×32 px. Cada cambio debe afectar únicamente al tramo solicitado, sin recolocar ni rediseñar todavía el resto del mapa.

## Primer tramo: C01/F01 a C45/F04

Las cuatro primeras filas del mapa, desde la columna 1 hasta la 45, se reservan como suelo continuo de hierba.

- Rango lógico: `C01/F01` a `C45/F04`.
- Tamaño del tramo: 45×4 celdas = 1440×128 px.
- Tile lógico de hierba: 4×4 celdas = 128×128 px.
- Los árboles del escenario se reducen a 5 unidades, alineadas horizontalmente en la banda superior y con sus puntos de apoyo en `C05/F05`, `C13/F05`, `C21/F05`, `C29/F05` y `C37/F05`.
- El suelo de ese tramo se fuerza a hierba, cubriendo cualquier suelo anterior que invadiese esas filas.
- No se modifica ningún otro elemento ni ninguna fila inferior.

Este documento se irá ampliando conforme se validen nuevos tramos del escenario.

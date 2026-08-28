# 22. Estándar de láminas de assets de interior

## Objetivo

Definir un formato estable para generar láminas de objetos ilustrados de interior y poder trocearlas automáticamente en PNG individuales sin recortes incorrectos.

## Estilo visual

Los interiores de Arkanis deben mantener un acabado ilustrado, no pixel art, coherente con los personajes y con el resto del entorno visual.

La ambientación se inspira ligeramente en lo medieval y rural, pero no representa una época histórica concreta. El resultado debe transmitir aventura, aldea y cabaña habitada, evitando un aspecto excesivamente medieval o realista.

## Formato estándar de la lámina

A partir de ahora, las láminas de assets de interior seguirán este formato:

- Tamaño total: **1280 × 1280 px**.
- Distribución: **4 columnas × 4 filas**.
- Total de elementos: **16**.
- Tamaño de cada celda: **320 × 320 px**.
- Fondo: **transparente**.
- Un único objeto por celda.
- Cada objeto debe quedar visualmente centrado dentro de su celda.
- Ningún objeto puede invadir una celda vecina.

## Zona segura

Cada celda de 320 × 320 px tendrá una zona segura aproximada de **260 × 260 px**.

Esto deja alrededor de **30 px de margen por cada lado**.

Ese margen debe considerarse mínimo. Si un objeto necesita más espacio, debe reducirse ligeramente o pasar a una lámina específica de elementos grandes.

El objetivo es evitar que el script de corte capture fragmentos de los objetos vecinos.

## Orden de lectura y corte

Los assets se ordenan de izquierda a derecha y de arriba abajo:

- Fila 1: elementos 1 a 4.
- Fila 2: elementos 5 a 8.
- Fila 3: elementos 9 a 12.
- Fila 4: elementos 13 a 16.

El script puede cortar la lámina matemáticamente en bloques exactos de 320 × 320 px.

## Flujo de trabajo

1. Se define previamente el listado de los 16 elementos.
2. Se genera una lámina 1280 × 1280 con cuadrícula conceptual 4 × 4.
3. Se revisa visualmente que todos los elementos respeten la zona segura.
4. La lámina maestra se guarda en:

   `public/assets/environment/interiors/source/`

5. El script `scripts/split-interior-sheet.mjs` genera los PNG individuales.
6. Los assets resultantes se guardan en:

   `public/assets/environment/interiors/cabin/`

7. Se revisan visualmente los 16 recortes antes de integrarlos en el mapa.

## Primera lámina de interiores

La primera lámina de prueba se generó antes de fijar este estándar definitivo.

Su tamaño fue aproximadamente **1254 × 1254 px**, por lo que no era divisible exactamente entre cuatro. El troceado produjo celdas de 313 × 313 px y varios objetos quedaron demasiado próximos a los límites de su celda.

La mayoría de los elementos resultaron válidos, pero aproximadamente cuatro o cinco requieren revisión o sustitución.

Esta primera lámina se conserva como prueba funcional, pero **no debe utilizarse como referencia de dimensiones para futuras láminas**.

## Regla definitiva

Para nuevas láminas de assets de interior:

**1280 × 1280 px · 4 × 4 · celda 320 × 320 px · objeto centrado · mínimo 30 px de margen por lado · fondo transparente.**

Este criterio prevalece sobre las dimensiones utilizadas en la primera prueba.

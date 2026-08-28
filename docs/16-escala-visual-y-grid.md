# Escala visual y grid

## Objetivo

Arkanis utilizará un grid lógico para mantener coherencia visual, facilitar la composición de mapas y permitir definir posiciones por celdas sin obligar a que todos los sprites sean tiles estrictos.

## Unidad base

La celda lógica base será de **32×32 px**.

Esto permite construir elementos en múltiplos sencillos de 32 px y mantiene suficiente precisión para objetos pequeños. El personaje de referencia ocupa visualmente **64×64 px**, es decir, aproximadamente **2×2 celdas**.

El grid sirve como sistema de composición y referencia. Los sprites pueden sobresalir de su huella lógica y las colisiones se definirán de forma independiente cuando sea necesario.

## Escala visual de referencia

La escala de los elementos se definirá tomando como referencia un personaje de 64×64 px.

| Elemento | Tamaño visual recomendado | Equivalencia aproximada |
| --- | ---: | ---: |
| Detalle pequeño / flor / hierba | 16–32 px | 0,5–1 celda |
| Moneda / objeto pequeño | 24–32 px | 1 celda o menos |
| Piedra pequeña | 24–32 px | 1 celda o menos |
| Piedra media / vasija | 32–48 px | 1–1,5 celdas |
| Personaje | 64×64 px | 2×2 celdas |
| Cofre / arbusto grande | 48–64 px | 1,5–2 celdas |
| Árbol | 128–160 px de alto | 4–5 celdas de alto |
| Cabaña pequeña | 192–256 px de ancho | 6–8 celdas |
| Edificio grande / ruina | múltiplos de 64 px | según diseño |

Estas medidas son una guía visual, no una restricción absoluta.

## Huella y colisión

El tamaño visual del sprite no tiene por qué coincidir con su huella física en el grid.

Ejemplos:

- un árbol puede medir 128×160 px, pero bloquear solo una base de 64×48 px;
- una cabaña puede ocupar visualmente 256×192 px y tener una zona de colisión inferior menor;
- un personaje de 64×64 px puede usar una colisión centrada en la zona de los pies.

La profundidad se ordenará principalmente por la posición vertical del punto de apoyo del objeto para que personajes y decorado puedan solaparse de forma natural.

## Composición de mapas por celdas

Los mapas nuevos podrán describirse usando coordenadas de grid, por ejemplo `columna 12, fila 8`, que se transformarán a píxeles con:

`x = columna × 32`

`y = fila × 32`

Cuando convenga centrar un sprite en una celda se añadirá media celda al cálculo.

Esto permitirá definir mapas mediante instrucciones como «árbol en C12/F8», «piedra en C16/F10» o «camino desde C4/F12 hasta C20/F12» y mantener coherencia espacial.

## Tiles de terreno

Los tiles de suelo deberían diseñarse preferentemente en tamaños compatibles con el grid: **32×32, 64×64, 128×128 o 256×256 px**. Un tile grande puede repetirse como textura, pero sus dimensiones deben ser múltiplos de 32 para que encaje con el sistema lógico.

Para evitar patrones repetitivos visibles, los terrenos principales deberían disponer en el futuro de varias variantes compatibles entre sí.

## Regla de consistencia

Antes de crear un nuevo asset visual se deberá decidir:

1. tamaño de lienzo;
2. tamaño visual previsto en juego;
3. huella lógica aproximada en celdas;
4. área de colisión;
5. punto de apoyo visual.

La referencia primaria seguirá siendo el personaje de 64×64 px y todos los objetos se escalarán de forma proporcional respecto a él.

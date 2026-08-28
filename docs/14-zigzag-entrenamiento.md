# Zigzag inferior del entrenamiento

La zona inferior del entrenamiento deja de ser una simple hilera de pinchos con monedas intercaladas y pasa a funcionar como un pequeño recorrido de lectura espacial.

Los pinchos forman barreras alternadas que obligan al jugador a avanzar hacia un extremo, bajar al siguiente tramo, recorrerlo en sentido contrario y volver a descender. Las monedas se colocan sobre la ruta segura y actúan como guía visual y recompensa.

El recorrido mantiene prácticamente la misma geometría anterior, pero todos los pinchos y todas las monedas quedan ahora referenciados al centro exacto de celdas del grid lógico de 32×32 px.

Para dar al personaje más espacio de paso, se añade una fila completa adicional entre las dos barreras horizontales principales. La primera se mantiene en `F21` y la segunda pasa de `F23` a `F24`, dejando libres `F22` y `F23` entre ambas.

## Pinchos alineados al grid

- `C11/F21`, `C13/F21`, `C16/F21`, `C18/F21`, `C20/F21`, `C22/F21`, `C24/F21`, `C26/F21`, `C34/F21`.
- `C11/F22`, `C34/F22`.
- `C18/F24`, `C20/F24`, `C22/F24`, `C24/F24`, `C26/F24`, `C28/F24`, `C30/F24`, `C32/F24`.
- `C11/F25`, `C33/F26`.

## Monedas alineadas al grid

- `C12/F20`, `C15/F20`, `C19/F20`, `C22/F20`, `C26/F20`, `C29/F20`.
- `C31/F23`, `C29/F23`, `C26/F23`, `C22/F23`, `C19/F23`, `C15/F23`.
- `C13/F25`, `C17/F26`, `C21/F26`, `C25/F26`, `C29/F26`.

La posición base de cada moneda coincide con el centro de su celda. La pequeña oscilación vertical de la animación es únicamente visual y no cambia su referencia lógica en el grid.

El recorrido no añade una condición nueva para desbloquear la salida: las monedas siguen siendo moneda global y el desbloqueo del portal depende de destruir las diez vasijas.

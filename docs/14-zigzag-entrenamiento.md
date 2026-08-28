# Zigzag inferior del entrenamiento

La zona inferior del entrenamiento deja de ser una simple hilera de pinchos con monedas intercaladas y pasa a funcionar como un pequeño recorrido de lectura espacial.

Los pinchos forman barreras alternadas que obligan al jugador a avanzar hacia un extremo, bajar al siguiente tramo, recorrerlo en sentido contrario y volver a descender. Las monedas se colocan sobre la ruta segura y actúan como guía visual y recompensa.

El recorrido mantiene prácticamente la misma geometría anterior, pero todos los pinchos y todas las monedas quedan ahora referenciados al centro exacto de celdas del grid lógico de 32×32 px.

## Pinchos alineados al grid

- `C11/F21`, `C13/F21`, `C16/F21`, `C18/F21`, `C20/F21`, `C22/F21`, `C24/F21`, `C26/F21`, `C34/F21`.
- `C11/F22`, `C34/F22`.
- `C18/F23`, `C20/F23`, `C22/F23`, `C24/F23`, `C26/F23`, `C28/F23`, `C30/F23`, `C32/F23`.
- `C11/F24`, `C33/F25`.

## Monedas alineadas al grid

- `C12/F20`, `C15/F20`, `C19/F20`, `C22/F20`, `C26/F20`, `C29/F20`.
- `C31/F22`, `C29/F22`, `C26/F22`, `C22/F22`, `C19/F22`, `C15/F22`.
- `C13/F24`, `C17/F25`, `C21/F25`, `C25/F25`, `C29/F25`.

La posición base de cada moneda coincide con el centro de su celda. La pequeña oscilación vertical de la animación es únicamente visual y no cambia su referencia lógica en el grid.

El recorrido no añade una condición nueva para desbloquear la salida: las monedas siguen siendo moneda global y el desbloqueo del portal depende de destruir las diez vasijas.

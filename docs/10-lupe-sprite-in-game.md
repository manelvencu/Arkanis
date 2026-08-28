# Lupe — sprite in-game

## Ficha visual validada

- Piel caucásica.
- Pelo marrón.
- Coleta alta.
- Ojos marrones.
- Camiseta azul.
- Pantalón corto verde.
- Zapatos lilas.
- Collar dorado con colgante en forma de ola de mar.

## Sistema de sprite

Lupe utiliza PNG independientes de alta resolución con fondo transparente y la misma estructura validada para Tiana.

### Down

`public/assets/characters/lupe/walk-down/`

- `lupe-idle-down.png`
- `lupe-walk-down-01.png`
- `lupe-walk-down-02.png`

### Right

`public/assets/characters/lupe/walk-right/`

- `lupe-idle-right.png`
- `lupe-walk-right-01.png`
- `lupe-walk-right-02.png`

### Up

`public/assets/characters/lupe/walk-up/`

- `lupe-idle-up.png`
- `lupe-walk-up-01.png`
- `lupe-walk-up-02.png`

### Left

No se duplican assets. La izquierda reutiliza los frames de right mediante espejo horizontal (`flipX`).

## Cadencia de movimiento

Lupe replica exactamente el estándar validado con Tiana:

- down: `walk-down-01 -> walk-down-02 -> ...`;
- up: `walk-up-01 -> walk-up-02 -> ...`;
- right: `walk-right-01 -> idle-right -> walk-right-02 -> idle-right -> ...`;
- left: misma secuencia lateral mediante `flipX`.

Al detenerse se muestra el idle de la dirección correspondiente.

## Tamaño y física

Lupe se muestra actualmente a **68×68 px** en la Zona de entrenamiento.

El cuerpo físico se mantiene separado del tamaño y resolución interna del PNG. Se concentra en la zona inferior del personaje con el mismo criterio usado para Tiana, permitiendo colisión con sólidos y solapamiento fiable con monedas y pinchos.

## Integración jugable

Lupe ya es seleccionable desde la pantalla de selección de personaje y entra en `TrainingScene` con sus sprites definitivos.

Utiliza el mismo movimiento, velocidad, controles, colisiones y disparo de rayo que Tiana. Las diferencias entre ambos personajes son visuales, no jugables.

Hasta disponer de poses específicas de disparo, Lupe reutiliza temporalmente el idle de la dirección actual mientras lanza el rayo.

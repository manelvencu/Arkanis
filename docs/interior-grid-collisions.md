# Estándar de colisiones por grid en interiores

## Regla principal

Los interiores se definen mediante **área jugable positiva**.

- por defecto una celda es no jugable;
- solo las celdas declaradas como jugables pueden ser pisadas;
- la autoridad es el **centro entre los pies**;
- la grid visual es únicamente una herramienta temporal de diseño.

## Grid estándar

- tamaño lógico: 960 × 540 px;
- columnas: 30;
- filas: 15;
- ancho de celda: 32 px;
- alto de celda: 36 px.

## Punto de referencia

El centro entre los pies se calcula actualmente con un offset vertical aproximado de +25 px desde el centro lógico del sprite.

El cuerpo del personaje puede solaparse visualmente con muebles por perspectiva. Lo que nunca puede entrar en una celda bloqueada es el punto de pies.

## Motor compartido

`src/interiorGridCollision.ts`

Responsabilidades:

- construir el conjunto de celdas permitidas;
- comprobar el punto de pies;
- resolver movimiento por ejes;
- permitir deslizamiento contra límites;
- subdividir movimientos largos para evitar atravesar celdas por lag o velocidad.

Velocidad de referencia actual en interiores:

**135 px/s**

## Mapas

### Zona de Entrenamiento

`src/interiorCollisionMaps.ts`

Cabaña 1 y Cabaña 3 comparten mapa.

Cabaña 2 tiene mapa propio.

### La Aldea

`src/villageInteriorCollisionMaps.ts`

Mapas:

- `coins`;
- `wine`;
- `blessing`.

### Iglesia

`src/churchInteriorCollisionMap.ts`

Pasillo jugable:

`F8 C14-C17` hasta `F15 C14-C17`.

## Cabaña 1 y 3 de ZE

```text
F6  C9-C26
F7  C9-C23
F8  C9-C23
F9  C5-C23
F10 C5-C23
F11 C5-C26
F12 C6-C26
F13 C14-C17
F14 C14-C17
F15 C14-C17
```

## Cabaña 2 de ZE

```text
F6  C6-C22
F7  C8-C22
F8  C8-C23
F9  C8-C26
F10 C8-C26
F11 C4-C26
F12 C4-C26
F13 C14-C17
F14 C14-C17
F15 C14-C17
```

## Cabaña coins de La Aldea

```text
F6  C9-C25
F7  C9-C23
F8  C8-C23
F9  C5-C23
F10 C5-C23
F11 C6-C27
F12 C6-C26
F13 C14-C17
F14 C14-C17
F15 C14-C17
```

## Tienda de vino

```text
F6  C8-C22
F7  C8-C24
F8  C9-C21
F9  C10-C22
F10 C10-C22
F11 C12-C22
F12 C13-C22
F13 C14-C17
F14 C14-C17
F15 C14-C17
```

## Cabaña blessing

```text
F5  C7-C21
F6  C5-C22
F7  C8-C23
F8  C8-C23
F9  C8-C26
F10 C8-C26
F11 C4-C26
F12 C4-C26
F13 C14-C17
F14 C14-C17
F15 C14-C17
```

## Iglesia

```text
F8-F15 C14-C17
```

## Grid visual

Las grids visibles de las cabañas de ZE, las cabañas de La Aldea y la iglesia se retiraron una vez validadas las zonas jugables.

No deben reactivarse para juego normal.

Si hay que definir un interior nuevo puede mostrarse temporalmente una guía visual y retirarla al terminar.

## Flujo para un interior nuevo

1. preparar fondo 960 × 540;
2. mostrar grid temporal 30 × 15;
3. medir con el centro entre los pies;
4. anotar únicamente rangos jugables;
5. añadir el mapa de datos;
6. comprobar los cuatro lados y diagonales;
7. comprobar salida;
8. retirar grid visual.

## Qué no hacer

- no construir límites con una colección creciente de rectángulos físicos;
- no usar el centro visual del sprite;
- no usar la grid dibujada como collider;
- no crear reglas especiales por dirección para tapar fugas;
- no duplicar mapas idénticos;
- no reintroducir blockers que contradigan una whitelist positiva.

## Documento relacionado

Para exteriores, entradas exactas y regla general:

`docs/grid-navigation-standard.md`

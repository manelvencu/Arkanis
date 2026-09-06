export type InteriorCellRange = {
  c1: number;
  f1: number;
  c2: number;
  f2: number;
};

export type InteriorGridDefinition = {
  columns: number;
  rows: number;
  roomWidth: number;
  roomHeight: number;
  /** Preferred model: only these cells are playable. Everything else is forbidden. */
  walkable?: InteriorCellRange[];
  /** Legacy fallback for maps not migrated yet. */
  blocked?: InteriorCellRange[];
};

// Se conserva este nombre mientras CabinInteriorScene migra su nomenclatura.
// width/height ya no deciden la celda: la autoridad es un único punto entre los pies.
export type FootprintDefinition = {
  width: number;
  height: number;
  offsetY: number;
};

export type GridMoveResult = {
  x: number;
  y: number;
  movedX: number;
  movedY: number;
};

const MAX_STEP_PIXELS = 4;

export function cellRange(c1: number, f1: number, c2: number, f2: number): InteriorCellRange {
  return { c1, f1, c2, f2 };
}

function buildCellSet(ranges: InteriorCellRange[]): ReadonlySet<string> {
  const cells = new Set<string>();
  for (const range of ranges) {
    for (let f = range.f1; f <= range.f2; f += 1) {
      for (let c = range.c1; c <= range.c2; c += 1) {
        cells.add(`${c}:${f}`);
      }
    }
  }
  return cells;
}

export function buildWalkableCellSet(definition: InteriorGridDefinition): ReadonlySet<string> {
  if (definition.walkable) return buildCellSet(definition.walkable);

  // Compatibilidad temporal con interiores aún expresados como bloqueos.
  const blocked = buildCellSet(definition.blocked ?? []);
  const walkable = new Set<string>();
  for (let f = 1; f <= definition.rows; f += 1) {
    for (let c = 1; c <= definition.columns; c += 1) {
      const key = `${c}:${f}`;
      if (!blocked.has(key)) walkable.add(key);
    }
  }
  return walkable;
}

/**
 * Alias temporal por compatibilidad con CabinInteriorScene.
 * Aunque el nombre histórico diga "Blocked", devuelve el conjunto AUTORIZADO.
 * El siguiente interior nuevo debe usar directamente buildWalkableCellSet.
 */
export function buildBlockedCellSet(definition: InteriorGridDefinition): ReadonlySet<string> {
  return buildWalkableCellSet(definition);
}

export function isFootprintWalkable(
  spriteX: number,
  spriteY: number,
  definition: InteriorGridDefinition,
  walkableCells: ReadonlySet<string>,
  footprint: FootprintDefinition
): boolean {
  // Punto de autoridad: centro horizontal del sprite + punto central entre los pies.
  // La cabeza, hombros y ancho visual pueden solaparse por perspectiva sin alterar la colisión.
  const footX = spriteX;
  const footY = spriteY + footprint.offsetY;

  if (footX < 0 || footX >= definition.roomWidth || footY < 0 || footY >= definition.roomHeight) return false;

  const cellWidth = definition.roomWidth / definition.columns;
  const cellHeight = definition.roomHeight / definition.rows;
  const column = Math.floor(footX / cellWidth) + 1;
  const row = Math.floor(footY / cellHeight) + 1;

  return walkableCells.has(`${column}:${row}`);
}

export function moveOnInteriorGrid(
  startX: number,
  startY: number,
  deltaX: number,
  deltaY: number,
  definition: InteriorGridDefinition,
  walkableCells: ReadonlySet<string>,
  footprint: FootprintDefinition
): GridMoveResult {
  const distance = Math.max(Math.abs(deltaX), Math.abs(deltaY));
  const steps = Math.max(1, Math.ceil(distance / MAX_STEP_PIXELS));
  const stepX = deltaX / steps;
  const stepY = deltaY / steps;

  let x = startX;
  let y = startY;

  for (let step = 0; step < steps; step += 1) {
    // Ejes independientes: al chocar en diagonal se desliza por el eje libre,
    // pero el punto de los pies nunca puede entrar en una celda no jugable.
    const candidateX = x + stepX;
    if (isFootprintWalkable(candidateX, y, definition, walkableCells, footprint)) x = candidateX;

    const candidateY = y + stepY;
    if (isFootprintWalkable(x, candidateY, definition, walkableCells, footprint)) y = candidateY;
  }

  return { x, y, movedX: x - startX, movedY: y - startY };
}

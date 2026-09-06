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

export type FootPointDefinition = {
  /** Vertical offset from sprite centre to the point between the character's feet. */
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

  // Compatibilidad temporal con interiores todavía definidos como zonas bloqueadas.
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

export function isFootPointWalkable(
  spriteX: number,
  spriteY: number,
  definition: InteriorGridDefinition,
  walkableCells: ReadonlySet<string>,
  footPoint: FootPointDefinition
): boolean {
  const x = spriteX;
  const y = spriteY + footPoint.offsetY;

  if (x < 0 || x >= definition.roomWidth || y < 0 || y >= definition.roomHeight) return false;

  const cellWidth = definition.roomWidth / definition.columns;
  const cellHeight = definition.roomHeight / definition.rows;
  const column = Math.floor(x / cellWidth) + 1;
  const row = Math.floor(y / cellHeight) + 1;

  return walkableCells.has(`${column}:${row}`);
}

export function moveOnInteriorGrid(
  startX: number,
  startY: number,
  deltaX: number,
  deltaY: number,
  definition: InteriorGridDefinition,
  walkableCells: ReadonlySet<string>,
  footPoint: FootPointDefinition
): GridMoveResult {
  const distance = Math.max(Math.abs(deltaX), Math.abs(deltaY));
  const steps = Math.max(1, Math.ceil(distance / MAX_STEP_PIXELS));
  const stepX = deltaX / steps;
  const stepY = deltaY / steps;

  let x = startX;
  let y = startY;

  for (let step = 0; step < steps; step += 1) {
    // Resolver por ejes permite deslizarse de forma natural por los bordes sin
    // permitir que el punto de apoyo entre jamás en una celda no jugable.
    const candidateX = x + stepX;
    if (isFootPointWalkable(candidateX, y, definition, walkableCells, footPoint)) x = candidateX;

    const candidateY = y + stepY;
    if (isFootPointWalkable(x, candidateY, definition, walkableCells, footPoint)) y = candidateY;
  }

  return { x, y, movedX: x - startX, movedY: y - startY };
}

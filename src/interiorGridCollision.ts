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
  blocked: InteriorCellRange[];
};

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

const EPSILON = 0.001;
const MAX_STEP_PIXELS = 4;

export function cellRange(c1: number, f1: number, c2: number, f2: number): InteriorCellRange {
  return { c1, f1, c2, f2 };
}

export function buildBlockedCellSet(definition: InteriorGridDefinition): ReadonlySet<string> {
  const blocked = new Set<string>();
  for (const range of definition.blocked) {
    for (let f = range.f1; f <= range.f2; f += 1) {
      for (let c = range.c1; c <= range.c2; c += 1) {
        blocked.add(`${c}:${f}`);
      }
    }
  }
  return blocked;
}

export function isFootprintWalkable(
  x: number,
  y: number,
  definition: InteriorGridDefinition,
  blockedCells: ReadonlySet<string>,
  footprint: FootprintDefinition
): boolean {
  const halfWidth = footprint.width / 2;
  const halfHeight = footprint.height / 2;
  const centerY = y + footprint.offsetY;
  const left = x - halfWidth;
  const right = x + halfWidth;
  const top = centerY - halfHeight;
  const bottom = centerY + halfHeight;

  if (left < 0 || right > definition.roomWidth || top < 0 || bottom > definition.roomHeight) return false;

  const cellWidth = definition.roomWidth / definition.columns;
  const cellHeight = definition.roomHeight / definition.rows;
  const firstColumn = Math.floor((left + EPSILON) / cellWidth) + 1;
  const lastColumn = Math.floor((right - EPSILON) / cellWidth) + 1;
  const firstRow = Math.floor((top + EPSILON) / cellHeight) + 1;
  const lastRow = Math.floor((bottom - EPSILON) / cellHeight) + 1;

  for (let f = firstRow; f <= lastRow; f += 1) {
    for (let c = firstColumn; c <= lastColumn; c += 1) {
      if (blockedCells.has(`${c}:${f}`)) return false;
    }
  }
  return true;
}

export function moveOnInteriorGrid(
  startX: number,
  startY: number,
  deltaX: number,
  deltaY: number,
  definition: InteriorGridDefinition,
  blockedCells: ReadonlySet<string>,
  footprint: FootprintDefinition
): GridMoveResult {
  const distance = Math.max(Math.abs(deltaX), Math.abs(deltaY));
  const steps = Math.max(1, Math.ceil(distance / MAX_STEP_PIXELS));
  const stepX = deltaX / steps;
  const stepY = deltaY / steps;

  let x = startX;
  let y = startY;

  for (let step = 0; step < steps; step += 1) {
    const candidateX = x + stepX;
    if (isFootprintWalkable(candidateX, y, definition, blockedCells, footprint)) x = candidateX;

    const candidateY = y + stepY;
    if (isFootprintWalkable(x, candidateY, definition, blockedCells, footprint)) y = candidateY;
  }

  return { x, y, movedX: x - startX, movedY: y - startY };
}

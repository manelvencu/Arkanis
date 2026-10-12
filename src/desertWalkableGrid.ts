export type DesertGridCell = {
  c: number;
  f: number;
};

export type DesertCellRange = {
  c1: number;
  f1: number;
  c2: number;
  f2: number;
};

export const DESERT_GRID_SIZE = 32;
export const DESERT_GRID_COLUMNS = 90;
export const DESERT_GRID_ROWS = 22;
export const DESERT_FOOT_OFFSET_Y = 20;

function range(c1: number, f1: number, c2: number, f2: number): DesertCellRange {
  return { c1, f1, c2, f2 };
}

function buildCellSet(ranges: DesertCellRange[]): ReadonlySet<string> {
  const cells = new Set<string>();
  for (const item of ranges) {
    for (let f = item.f1; f <= item.f2; f += 1) {
      for (let c = item.c1; c <= item.c2; c += 1) {
        cells.add(`${c}:${f}`);
      }
    }
  }
  return cells;
}

/**
 * El Desierto de Mil Soles.
 *
 * Whitelist positiva levantada a partir de las líneas rojas de diseño:
 * solo estas celdas pueden ser pisadas por el centro entre los pies.
 * Todo lo no declarado queda bloqueado.
 */
const WALKABLE_RANGES: DesertCellRange[] = [
  range(67, 7, 71, 7),

  range(66, 8, 75, 8),

  range(10, 9, 23, 9),
  range(65, 9, 75, 9),

  range(21, 10, 32, 10),
  range(65, 10, 75, 10),

  range(23, 11, 25, 11),
  range(63, 11, 73, 11),
  range(85, 11, 86, 11),

  range(15, 12, 17, 12),
  range(23, 12, 24, 12),
  range(46, 12, 54, 12),
  range(62, 12, 72, 12),
  range(83, 12, 85, 12),

  range(22, 13, 25, 13),
  range(29, 13, 33, 13),
  range(40, 13, 56, 13),
  range(64, 13, 74, 13),
  range(83, 13, 84, 13),

  range(7, 14, 9, 14),
  range(15, 14, 41, 14),
  range(52, 14, 70, 14),
  range(82, 14, 83, 14),

  range(7, 15, 11, 15),
  range(31, 15, 33, 15),
  range(38, 15, 39, 15),
  range(57, 15, 67, 15),
  range(75, 15, 82, 15),

  range(9, 16, 19, 16),
  range(25, 16, 28, 16),
  range(54, 16, 67, 16),

  range(22, 17, 26, 17),
  range(55, 17, 67, 17),

  range(15, 18, 16, 18),
  range(22, 18, 24, 18),
  range(56, 18, 66, 18),

  range(15, 19, 22, 19),
  range(56, 19, 64, 19),

  range(15, 20, 20, 20),

  range(15, 21, 18, 21)
];

export const DESERT_WALKABLE_CELLS = buildCellSet(WALKABLE_RANGES);

export function getDesertFootCell(spriteX: number, spriteY: number): DesertGridCell | null {
  const footX = spriteX;
  const footY = spriteY + DESERT_FOOT_OFFSET_Y;
  const worldWidth = DESERT_GRID_COLUMNS * DESERT_GRID_SIZE;
  const worldHeight = DESERT_GRID_ROWS * DESERT_GRID_SIZE;

  if (footX < 0 || footX >= worldWidth || footY < 0 || footY >= worldHeight) {
    return null;
  }

  return {
    c: Math.floor(footX / DESERT_GRID_SIZE) + 1,
    f: Math.floor(footY / DESERT_GRID_SIZE) + 1
  };
}

export function isDesertWalkableFootPoint(spriteX: number, spriteY: number): boolean {
  const cell = getDesertFootCell(spriteX, spriteY);
  return cell ? DESERT_WALKABLE_CELLS.has(`${cell.c}:${cell.f}`) : false;
}

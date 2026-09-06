export type AldeaGridCell = {
  c: number;
  f: number;
};

export type AldeaCellRange = {
  c1: number;
  f1: number;
  c2: number;
  f2: number;
};

export const ALDEA_GRID_SIZE = 32;
export const ALDEA_GRID_COLUMNS = 30;
export const ALDEA_GRID_ROWS = 22;
export const ALDEA_FOOT_OFFSET_Y = 20;

function range(c1: number, f1: number, c2: number, f2: number): AldeaCellRange {
  return { c1, f1, c2, f2 };
}

// Área jugable exterior de La Aldea.
// Regla: únicamente estas celdas pueden ser pisadas por el centro entre los pies.
// Todo lo demás queda fuera de la zona jugable.
const WALKABLE_RANGES: AldeaCellRange[] = [
  // Pasillo a cabaña superior.
  range(11, 6, 13, 6),
  range(11, 7, 13, 7),

  // Plaza.
  range(11, 8, 21, 10),
  range(11, 11, 15, 11),
  range(17, 11, 21, 11),
  range(11, 12, 21, 14),

  // Acceso iglesia.
  range(18, 7, 19, 7),

  // Camino de tierra hacia la salida superior derecha.
  range(22, 8, 29, 9),
  range(27, 2, 27, 7),
  range(28, 2, 28, 9),
  range(29, 2, 30, 5),

  // Pasillo derecho y ramales hacia cabañas.
  range(22, 13, 26, 13),
  range(22, 14, 27, 14),
  range(25, 15, 27, 20),
  range(17, 21, 27, 22),
  range(22, 19, 22, 20),
  range(17, 15, 19, 20),

  // Pasillo lateral izquierdo.
  range(5, 13, 10, 13),
  range(5, 12, 10, 12),
  range(5, 11, 7, 11),
  range(6, 10, 6, 10),

  // Pasillo lateral inferior izquierdo.
  range(1, 20, 13, 22),
  range(4, 19, 6, 20),
  range(5, 18, 5, 19)
];

function buildCellSet(ranges: AldeaCellRange[]): ReadonlySet<string> {
  const cells = new Set<string>();
  for (const item of ranges) {
    for (let f = item.f1; f <= item.f2; f += 1) {
      for (let c = item.c1; c <= item.c2; c += 1) cells.add(`${c}:${f}`);
    }
  }
  return cells;
}

export const ALDEA_WALKABLE_CELLS = buildCellSet(WALKABLE_RANGES);

export const ALDEA_ENTRANCE_CELLS = {
  church: buildCellSet([range(18, 7, 19, 7)]),
  blessing: buildCellSet([range(26, 13, 26, 13)]),
  wine: buildCellSet([range(22, 19, 22, 20)]),
  coins: buildCellSet([range(5, 18, 5, 19)])
} as const;

export function getAldeaFootCell(spriteX: number, spriteY: number): AldeaGridCell | null {
  const footX = spriteX;
  const footY = spriteY + ALDEA_FOOT_OFFSET_Y;
  const worldWidth = ALDEA_GRID_COLUMNS * ALDEA_GRID_SIZE;
  const worldHeight = ALDEA_GRID_ROWS * ALDEA_GRID_SIZE;

  if (footX < 0 || footX >= worldWidth || footY < 0 || footY >= worldHeight) return null;

  return {
    c: Math.floor(footX / ALDEA_GRID_SIZE) + 1,
    f: Math.floor(footY / ALDEA_GRID_SIZE) + 1
  };
}

export function isAldeaWalkableFootPoint(spriteX: number, spriteY: number): boolean {
  const cell = getAldeaFootCell(spriteX, spriteY);
  return cell ? ALDEA_WALKABLE_CELLS.has(`${cell.c}:${cell.f}`) : false;
}

export function isAldeaEntranceCell(
  entrance: keyof typeof ALDEA_ENTRANCE_CELLS,
  spriteX: number,
  spriteY: number
): boolean {
  const cell = getAldeaFootCell(spriteX, spriteY);
  return cell ? ALDEA_ENTRANCE_CELLS[entrance].has(`${cell.c}:${cell.f}`) : false;
}

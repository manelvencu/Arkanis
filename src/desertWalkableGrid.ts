export type DesertGridCell = {
  c: number;
  f: number;
};

export const DESERT_GRID_SIZE = 32;
export const DESERT_GRID_COLUMNS = 90;
export const DESERT_GRID_ROWS = 22;
export const DESERT_FOOT_OFFSET_Y = 20;

function buildHorizontalRanges(ranges: Array<{ c1: number; c2: number; f: number }>): ReadonlySet<string> {
  const cells = new Set<string>();

  for (const item of ranges) {
    for (let c = item.c1; c <= item.c2; c += 1) {
      cells.add(`${c}:${item.f}`);
    }
  }

  return cells;
}

/**
 * El Desierto de Mil Soles.
 *
 * Toda la pantalla está bloqueada por defecto.
 * Solo son transitables los rangos horizontales autorizados expresamente.
 *
 * Rangos autorizados actualmente:
 * - C5/F12 a C8/F12
 * - C6/F13 a C9/F13
 * - C8/F14 a C10/F14
 * - C8/F15 a C20/F15
 * - C14/F14 a C29/F14
 * - C15/F13 a C30/F13
 * - C12/F12 a C25/F12
 * - C16/F11 a C17/F11
 * - C16/F10 a C18/F10
 * - C16/F9 a C30/F9
 * - C10/F8 a C23/F8
 * - C23/F10 a C25/F10
 * - C23/F11 a C24/F11
 * - C11/F16 a C19/F16
 * - C15/F17 a C16/F17
 * - C15/F18 a C17/F18
 * - C16/F19 a C20/F19
 * - C20/F18 a C22/F18
 * - C22/F17 a C24/F17
 * - C23/F16 a C26/F16
 * - C23/F12 a C29/F12
 * - C31/F13 a C42/F13
 * - C18/F7 a C19/F7
 * - C18/F6 a C19/F6
 * - C25/F15 a C28/F15
 * - C30/F12 a C33/F12
 * - C40/F12 a C55/F12
 * - C45/F11 a C55/F11
 * - C52/F13 a C58/F13
 * - C57/F14 a C67/F14
 * - C54/F15 a C67/F15
 * - C55/F16 a C59/F16
 * - C56/F17 a C59/F17
 * - C56/F18 a C59/F18
 * - C64/F13 a C70/F13
 * - C63/F12 a C71/F12
 * - C61/F11 a C71/F11
 * - C63/F10 a C71/F10
 * - C67/F9 a C74/F9
 * - C67/F8 a C74/F8
 * - C67/F7 a C74/F7
 * - C67/F6 a C71/F6
 * - C72/F12 a C73/F12
 * - C73/F13 a C76/F13
 * - C75/F14 a C83/F14
 * - C77/F15 a C81/F15
 * - C82/F13 a C83/F13
 * - C83/F12 a C84/F12
 * - C84/F11 a C85/F11
 */
export const DESERT_WALKABLE_CELLS: ReadonlySet<string> = buildHorizontalRanges([
  { c1: 5, c2: 8, f: 12 },
  { c1: 6, c2: 9, f: 13 },
  { c1: 8, c2: 10, f: 14 },
  { c1: 8, c2: 20, f: 15 },
  { c1: 14, c2: 29, f: 14 },
  { c1: 15, c2: 30, f: 13 },
  { c1: 12, c2: 25, f: 12 },
  { c1: 16, c2: 17, f: 11 },
  { c1: 16, c2: 18, f: 10 },
  { c1: 16, c2: 30, f: 9 },
  { c1: 10, c2: 23, f: 8 },
  { c1: 23, c2: 25, f: 10 },
  { c1: 23, c2: 24, f: 11 },
  { c1: 11, c2: 19, f: 16 },
  { c1: 15, c2: 16, f: 17 },
  { c1: 15, c2: 17, f: 18 },
  { c1: 16, c2: 20, f: 19 },
  { c1: 20, c2: 22, f: 18 },
  { c1: 22, c2: 24, f: 17 },
  { c1: 23, c2: 26, f: 16 },
  { c1: 23, c2: 29, f: 12 },
  { c1: 31, c2: 42, f: 13 },
  { c1: 18, c2: 19, f: 7 },
  { c1: 18, c2: 19, f: 6 },
  { c1: 25, c2: 28, f: 15 },
  { c1: 30, c2: 33, f: 12 },
  { c1: 40, c2: 55, f: 12 },
  { c1: 45, c2: 55, f: 11 },
  { c1: 52, c2: 58, f: 13 },
  { c1: 57, c2: 67, f: 14 },
  { c1: 54, c2: 67, f: 15 },
  { c1: 55, c2: 59, f: 16 },
  { c1: 56, c2: 59, f: 17 },
  { c1: 56, c2: 59, f: 18 },
  { c1: 64, c2: 70, f: 13 },
  { c1: 63, c2: 71, f: 12 },
  { c1: 61, c2: 71, f: 11 },
  { c1: 63, c2: 71, f: 10 },
  { c1: 67, c2: 74, f: 9 },
  { c1: 67, c2: 74, f: 8 },
  { c1: 67, c2: 74, f: 7 },
  { c1: 67, c2: 71, f: 6 },
  { c1: 72, c2: 73, f: 12 },
  { c1: 73, c2: 76, f: 13 },
  { c1: 75, c2: 83, f: 14 },
  { c1: 77, c2: 81, f: 15 },
  { c1: 82, c2: 83, f: 13 },
  { c1: 83, c2: 84, f: 12 },
  { c1: 84, c2: 85, f: 11 }
]);

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

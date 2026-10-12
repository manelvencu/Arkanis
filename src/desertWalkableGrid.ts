export type DesertGridCell = {
  c: number;
  f: number;
};

export const DESERT_GRID_SIZE = 32;
export const DESERT_GRID_COLUMNS = 90;
export const DESERT_GRID_ROWS = 22;
export const DESERT_FOOT_OFFSET_Y = 20;

/**
 * El Desierto de Mil Soles.
 *
 * Estado base de diseño:
 * - toda la pantalla está bloqueada por defecto;
 * - no existe ninguna celda transitable hasta que se añada explícitamente;
 * - las futuras aperturas se definirán únicamente a partir de los rangos
 *   autorizados por diseño.
 */
export const DESERT_WALKABLE_CELLS: ReadonlySet<string> = new Set<string>();

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

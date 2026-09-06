import { cellRange, type InteriorGridDefinition } from './interiorGridCollision';
import type { VillageCabinKind } from './villageProgress';

const ROOM_WIDTH = 960;
const ROOM_HEIGHT = 540;
const COLUMNS = 30;
const ROWS = 15;

// Cabaña inferior izquierda de La Aldea (kind: coins).
// Autoridad: punto central entre los pies. Todo lo no listado es NO jugable.
const ALDEA_LOWER_LEFT_WALKABLE = [
  cellRange(9, 6, 25, 6),
  cellRange(9, 7, 23, 7),
  cellRange(8, 8, 23, 8),
  cellRange(5, 9, 23, 9),
  cellRange(5, 10, 23, 10),
  cellRange(6, 11, 27, 11),
  cellRange(6, 12, 26, 12),
  cellRange(14, 13, 17, 13),
  cellRange(14, 14, 17, 14),
  cellRange(14, 15, 17, 15)
];

// Tienda de vino de La Aldea (kind: wine, cabaña inferior derecha).
// Autoridad: punto central entre los pies. Todo lo no listado es NO jugable.
const ALDEA_WINE_SHOP_WALKABLE = [
  cellRange(8, 6, 22, 6),
  cellRange(8, 7, 24, 7),
  cellRange(9, 8, 21, 8),
  cellRange(10, 9, 22, 9),
  cellRange(10, 10, 22, 10),
  cellRange(12, 11, 22, 11),
  cellRange(13, 12, 22, 12),
  cellRange(14, 13, 17, 13),
  cellRange(14, 14, 17, 14),
  cellRange(14, 15, 17, 15)
];

// Cabaña de la parte derecha, justo encima de la tienda de vino (kind: blessing).
// Autoridad: punto central entre los pies. Todo lo no listado es NO jugable.
const ALDEA_UPPER_RIGHT_WALKABLE = [
  cellRange(7, 5, 21, 5),
  cellRange(5, 6, 22, 6),
  cellRange(8, 7, 23, 7),
  cellRange(8, 8, 23, 8),
  cellRange(8, 9, 26, 9),
  cellRange(8, 10, 26, 10),
  cellRange(4, 11, 26, 11),
  cellRange(4, 12, 26, 12),
  cellRange(14, 13, 17, 13),
  cellRange(14, 14, 17, 14),
  cellRange(14, 15, 17, 15)
];

function makeWalkableDefinition(walkable: InteriorGridDefinition['walkable']): InteriorGridDefinition {
  return {
    columns: COLUMNS,
    rows: ROWS,
    roomWidth: ROOM_WIDTH,
    roomHeight: ROOM_HEIGHT,
    walkable
  };
}

export const VILLAGE_CABIN_COLLISION_MAPS: Partial<Record<VillageCabinKind, InteriorGridDefinition>> = {
  coins: makeWalkableDefinition(ALDEA_LOWER_LEFT_WALKABLE),
  wine: makeWalkableDefinition(ALDEA_WINE_SHOP_WALKABLE),
  blessing: makeWalkableDefinition(ALDEA_UPPER_RIGHT_WALKABLE)
};

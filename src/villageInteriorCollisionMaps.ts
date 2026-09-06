import { cellRange, type InteriorGridDefinition } from './interiorGridCollision';
import type { VillageCabinKind } from './villageProgress';

const ROOM_WIDTH = 960;
const ROOM_HEIGHT = 540;
const COLUMNS = 30;
const ROWS = 15;

// Cabaña inferior derecha de La Aldea (kind: wine).
// Autoridad: punto central entre los pies. Todo lo no listado es NO jugable.
const ALDEA_LOWER_RIGHT_WALKABLE = [
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
  wine: makeWalkableDefinition(ALDEA_LOWER_RIGHT_WALKABLE)
};

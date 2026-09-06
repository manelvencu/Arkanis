import { cellRange, type InteriorGridDefinition } from './interiorGridCollision';

const ROOM_WIDTH = 960;
const ROOM_HEIGHT = 540;
const COLUMNS = 30;
const ROWS = 15;

// Cabaña 1 y Cabaña 3 comparten distribución visual.
// Regla: SOLO estas celdas son jugables tomando como referencia el punto central entre los pies.
const CABIN_ONE_WALKABLE = [
  cellRange(9, 6, 26, 6),
  cellRange(9, 7, 23, 7),
  cellRange(9, 8, 23, 8),
  cellRange(5, 9, 23, 9),
  cellRange(5, 10, 23, 10),
  cellRange(5, 11, 26, 11),
  cellRange(6, 12, 26, 12),
  cellRange(14, 13, 17, 13),
  cellRange(14, 14, 17, 14),
  cellRange(14, 15, 17, 15)
];

// Cabaña 2: área jugable positiva. Todo lo demás queda automáticamente no jugable.
const CABIN_TWO_WALKABLE = [
  cellRange(6, 6, 22, 6),
  cellRange(8, 7, 22, 7),
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

export const TRAINING_CABIN_COLLISION_MAPS: Record<string, InteriorGridDefinition> = {
  CabinOneScene: makeWalkableDefinition(CABIN_ONE_WALKABLE),
  CabinTwoScene: makeWalkableDefinition(CABIN_TWO_WALKABLE),
  CabinThreeScene: makeWalkableDefinition(CABIN_ONE_WALKABLE)
};

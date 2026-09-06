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

// Cabaña 2 todavía conserva temporalmente el modelo antiguo de bloqueos hasta
// que definamos también su área jugable positiva.
const CABIN_TWO_BLOCKED = [
  cellRange(1, 1, 30, 3),
  cellRange(1, 4, 6, 15),
  cellRange(27, 4, 30, 15),
  cellRange(26, 1, 26, 15),
  cellRange(23, 4, 25, 7),
  cellRange(22, 4, 24, 5),
  cellRange(7, 11, 13, 15),
  cellRange(18, 11, 25, 15)
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

function makeBlockedDefinition(blocked: InteriorGridDefinition['blocked']): InteriorGridDefinition {
  return {
    columns: COLUMNS,
    rows: ROWS,
    roomWidth: ROOM_WIDTH,
    roomHeight: ROOM_HEIGHT,
    blocked
  };
}

export const TRAINING_CABIN_COLLISION_MAPS: Record<string, InteriorGridDefinition> = {
  CabinOneScene: makeWalkableDefinition(CABIN_ONE_WALKABLE),
  CabinTwoScene: makeBlockedDefinition(CABIN_TWO_BLOCKED),
  CabinThreeScene: makeWalkableDefinition(CABIN_ONE_WALKABLE)
};

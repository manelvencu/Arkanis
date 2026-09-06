import { cellRange, type InteriorGridDefinition } from './interiorGridCollision';

const ROOM_WIDTH = 960;
const ROOM_HEIGHT = 540;
const COLUMNS = 30;
const ROWS = 15;

const CABIN_ONE_BLOCKED = [
  cellRange(1, 1, 30, 4),
  cellRange(1, 5, 8, 5),
  cellRange(27, 5, 30, 5),
  cellRange(1, 6, 4, 12),
  cellRange(27, 6, 30, 12),
  cellRange(5, 6, 8, 8),
  cellRange(24, 7, 27, 10),
  cellRange(1, 11, 13, 12),
  cellRange(18, 11, 30, 12),
  cellRange(1, 13, 13, 15),
  cellRange(18, 13, 30, 15)
];

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

function makeDefinition(blocked: InteriorGridDefinition['blocked']): InteriorGridDefinition {
  return {
    columns: COLUMNS,
    rows: ROWS,
    roomWidth: ROOM_WIDTH,
    roomHeight: ROOM_HEIGHT,
    blocked
  };
}

export const TRAINING_CABIN_COLLISION_MAPS: Record<string, InteriorGridDefinition> = {
  CabinOneScene: makeDefinition(CABIN_ONE_BLOCKED),
  CabinTwoScene: makeDefinition(CABIN_TWO_BLOCKED),
  CabinThreeScene: makeDefinition(CABIN_ONE_BLOCKED)
};

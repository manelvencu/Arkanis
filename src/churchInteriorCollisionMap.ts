import { cellRange, type InteriorGridDefinition } from './interiorGridCollision';

const ROOM_WIDTH = 960;
const ROOM_HEIGHT = 540;
const COLUMNS = 30;
const ROWS = 15;

// Iglesia de La Aldea.
// Solo el pasillo central es jugable, tomando como referencia el centro entre los pies.
// F8C14-F8C17 y continúa hacia abajo hasta F15C14-F15C17.
const CHURCH_WALKABLE = [
  cellRange(14, 8, 17, 15)
];

export const CHURCH_INTERIOR_COLLISION_MAP: InteriorGridDefinition = {
  columns: COLUMNS,
  rows: ROWS,
  roomWidth: ROOM_WIDTH,
  roomHeight: ROOM_HEIGHT,
  walkable: CHURCH_WALKABLE
};

import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';
import {
  createPlayableUi,
  preloadPlayableUiAssets,
  type PlayableUiController
} from '../playableSceneUi';
import {
  getVillageProgress,
  grantDesertCarpetForMazeTest,
  hasUsableDesertCarpet,
  obtainDesertFragment,
  setVillageEnergy,
  useDesertCarpetInMaze
} from '../villageProgress';

interface MazeSceneData {
  characterId?: CharacterId;
}

type Facing = 'down' | 'up' | 'side';

const GRID_SIZE = 32;
const WORLD_COLUMNS = 80;
const WORLD_ROWS = 80;
const WORLD_WIDTH = WORLD_COLUMNS * GRID_SIZE;
const WORLD_HEIGHT = WORLD_ROWS * GRID_SIZE;

const PLAYER_SIZE = 64;
const PLAYER_SPEED = 170;
const PLAYER_FOOT_OFFSET_Y = 20;

const PLAYER_START_CELL = { column: 40, row: 78 } as const;
const PLAYER_START = {
  x: (PLAYER_START_CELL.column - 0.5) * GRID_SIZE,
  y: (PLAYER_START_CELL.row - 0.5) * GRID_SIZE - PLAYER_FOOT_OFFSET_Y
} as const;

const CENTER_ROOM = {
  left: 35,
  right: 46,
  top: 35,
  bottom: 46
} as const;

const GRID_TEXTURE_KEY = 'maze-grid-guide';
const BLACK_SUN_VISION_RADIUS = 180;
const BLACK_SUN_FEATHER_RADIUS = 250;
const BLACK_SUN_DARKNESS_ALPHA = 0.94;
const BLACK_SUN_SPOTLIGHT_STEP = 3;
const CARPET_PIT_BLOCK_RADIUS = 46;
const CARPET_PIT_USE_RADIUS = 58;
const CARPET_PIT_POSITION = {
  column: 56,
  rows: [34, 35]
} as const;
const FALSE_BRANCH_JUNCTION = { column: 68, row: 76 } as const;
const BLACK_SUN_GATE = {
  columns: [48, 49],
  rows: [67, 68]
} as const;
const SACRED_BRAZIER_POSITION = {
  column: 32,
  rows: [60, 61]
} as const;
const MOVING_WALL_TRIGGER_RADIUS = 26;
const SACRED_BRAZIER_TRIGGER_RADIUS = 34;
const MAZE_SCORPION_SIZE = 24;
const MAZE_SCORPION_SPEED = 72;
const MAZE_SCORPION_DAMAGE = 15;
const MAZE_SCORPION_TRIGGER_RADIUS = 80;
const MAZE_SCORPION_LIFETIME = 6500;
const STATUE_PROJECTILE_SPEED = 155;
const STATUE_PROJECTILE_DAMAGE = 15;
const STATUE_FIRE_INTERVAL = 900;
const STATUE_ACTIVE_RADIUS = 300;
const STATUE_PROJECTILE_LIFETIME = 1200;
const FINAL_GATE_COLUMNS = [39, 40, 41, 42] as const;
const FINAL_GATE_ROW = 47;
const FRAGMENT_INTERACTION_RADIUS = 48;
const NORTH_GATE_COLUMNS = [40, 41, 42, 43] as const;
const NORTH_GATE_ROW = 34;
const RETURN_BRIDGE_COLUMNS = [6, 7] as const;
const RETURN_BRIDGE_ROWS = [76, 77] as const;
const SECOND_BLACK_SUN_GATE = {
  column: 71,
  rows: [24, 25]
} as const;
const SECOND_SACRED_BRAZIER_POSITION = {
  column: 9,
  row: 24
} as const;

type MazeLandmarkId =
  | 'blackSun'
  | 'falseBranch'
  | 'carpetPit'
  | 'movingWalls'
  | 'sacredBrazier'
  | 'statueCorridor';

interface MazeLandmark {
  id: MazeLandmarkId;
  label: string;
  color: number;
  column: number;
  row: number;
}

const CHARACTER_ASSETS = {
  tiana: {
    down: './assets/characters/tiana/walk-down/tiana-idle-down.png',
    down1: './assets/characters/tiana/walk-down/tiana-walk-down-01.png',
    down2: './assets/characters/tiana/walk-down/tiana-walk-down-02.png',
    side: './assets/characters/tiana/walk-right/tiana-idle-right.png',
    side1: './assets/characters/tiana/walk-right/tiana-walk-right-01.png',
    side2: './assets/characters/tiana/walk-right/tiana-walk-right-02.png',
    up: './assets/characters/tiana/walk-up/tiana-idle-up.png',
    up1: './assets/characters/tiana/walk-up/tiana-walk-up-01.png',
    up2: './assets/characters/tiana/walk-up/tiana-walk-up-02.png'
  },
  lupe: {
    down: './assets/characters/lupe/walk-down/lupe-idle-down.png',
    down1: './assets/characters/lupe/walk-down/lupe-walk-down-01.png',
    down2: './assets/characters/lupe/walk-down/lupe-walk-down-02.png',
    side: './assets/characters/lupe/walk-right/lupe-idle-right.png',
    side1: './assets/characters/lupe/walk-right/lupe-walk-right-01.png',
    side2: './assets/characters/lupe/walk-right/lupe-walk-right-02.png',
    up: './assets/characters/lupe/walk-up/lupe-idle-up.png',
    up1: './assets/characters/lupe/walk-up/lupe-walk-up-01.png',
    up2: './assets/characters/lupe/walk-up/lupe-walk-up-02.png'
  }
} as const;

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function coarseKey(x: number, y: number): string {
  return `${x}:${y}`;
}

function buildMazeWalkableCells(): ReadonlySet<string> {
  // Generamos primero un laberinto perfecto de 39x39 celdas lógicas.
  // Al duplicarlo obtenemos corredores de 2 bloques de ancho y paredes
  // de 2 bloques de grosor dentro del grid final de 80x80.
  const coarseSize = 39;
  const logicalCells = 19;
  const openCoarse = new Set<string>();
  const visited = new Set<string>();
  const random = createSeededRandom(0xA2C4D6E8);

  type Node = { x: number; y: number };
  const stack: Node[] = [{ x: 0, y: 18 }];
  visited.add(coarseKey(0, 18));

  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ] as const;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const coarseCellX = current.x * 2 + 1;
    const coarseCellY = current.y * 2 + 1;
    openCoarse.add(coarseKey(coarseCellX, coarseCellY));

    const candidates = directions
      .map((direction) => ({
        x: current.x + direction.dx,
        y: current.y + direction.dy,
        direction
      }))
      .filter((candidate) => (
        candidate.x >= 0 &&
        candidate.x < logicalCells &&
        candidate.y >= 0 &&
        candidate.y < logicalCells &&
        !visited.has(coarseKey(candidate.x, candidate.y))
      ));

    if (candidates.length === 0) {
      stack.pop();
      continue;
    }

    const next = candidates[Math.floor(random() * candidates.length)];
    visited.add(coarseKey(next.x, next.y));

    const nextCoarseX = next.x * 2 + 1;
    const nextCoarseY = next.y * 2 + 1;
    openCoarse.add(coarseKey(
      coarseCellX + next.direction.dx,
      coarseCellY + next.direction.dy
    ));
    openCoarse.add(coarseKey(nextCoarseX, nextCoarseY));
    stack.push({ x: next.x, y: next.y });
  }

  const walkable = new Set<string>();

  // Escalamos cada celda gruesa 2x2 y dejamos un borde exterior de 1 bloque.
  for (let coarseY = 0; coarseY < coarseSize; coarseY += 1) {
    for (let coarseX = 0; coarseX < coarseSize; coarseX += 1) {
      if (!openCoarse.has(coarseKey(coarseX, coarseY))) continue;

      const baseColumn = 2 + coarseX * 2;
      const baseRow = 2 + coarseY * 2;

      for (let offsetY = 0; offsetY < 2; offsetY += 1) {
        for (let offsetX = 0; offsetX < 2; offsetX += 1) {
          walkable.add(`${baseColumn + offsetX}:${baseRow + offsetY}`);
        }
      }
    }
  }

  // Acceso inferior central.
  for (let row = 75; row <= 80; row += 1) {
    for (let column = 39; column <= 42; column += 1) {
      walkable.add(`${column}:${row}`);
    }
  }

  // Conexión del acceso con el laberinto generado.
  for (let row = 72; row <= 78; row += 1) {
    for (let column = 39; column <= 42; column += 1) {
      walkable.add(`${column}:${row}`);
    }
  }

  // Cámara central: el objetivo puede percibirse como destino, pero queda
  // completamente sellado durante esta fase. Eliminamos cualquier contacto
  // accidental del laberinto generado con el anillo exterior de la cámara.
  for (let row = CENTER_ROOM.top; row <= CENTER_ROOM.bottom; row += 1) {
    for (let column = CENTER_ROOM.left; column <= CENTER_ROOM.right; column += 1) {
      walkable.add(`${column}:${row}`);
    }
  }

  for (let column = CENTER_ROOM.left - 1; column <= CENTER_ROOM.right + 1; column += 1) {
    walkable.delete(`${column}:${CENTER_ROOM.top - 1}`);
    walkable.delete(`${column}:${CENTER_ROOM.bottom + 1}`);
  }
  for (let row = CENTER_ROOM.top - 1; row <= CENTER_ROOM.bottom + 1; row += 1) {
    walkable.delete(`${CENTER_ROOM.left - 1}:${row}`);
    walkable.delete(`${CENTER_ROOM.right + 1}:${row}`);
  }

  // Acceso final reservado en el lado sur. F47 forma parte físicamente del
  // corredor, pero MazeScene la mantiene bloqueada hasta superar los hitos
  // obligatorios del laberinto.
  for (let row = 47; row <= 52; row += 1) {
    for (let column = 39; column <= 42; column += 1) {
      walkable.add(`${column}:${row}`);
    }
  }

  // Tras recoger el fragmento, la cámara se transforma: se abre al norte
  // hacia el gran componente superior y, mucho más adelante, ese recorrido
  // vuelve a enlazar con la ruta de salida por el extremo inferior izquierdo.
  for (const column of NORTH_GATE_COLUMNS) {
    walkable.add(`${column}:${NORTH_GATE_ROW}`);
  }

  for (const row of RETURN_BRIDGE_ROWS) {
    for (const column of RETURN_BRIDGE_COLUMNS) {
      walkable.add(`${column}:${row}`);
    }
  }

  return walkable;
}

const MAZE_WALKABLE_CELLS = buildMazeWalkableCells();

function findMazeLandmarkCells(): MazeLandmark[] {
  const start = PLAYER_START_CELL;
  const queue: Array<{ column: number; row: number }> = [start];
  const distances = new Map<string, number>([
    [`${start.column}:${start.row}`, 0]
  ]);
  let cursor = 0;

  const directions = [
    { dc: 1, dr: 0 },
    { dc: -1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: 0, dr: -1 }
  ] as const;

  while (cursor < queue.length) {
    const current = queue[cursor];
    cursor += 1;
    const currentDistance =
      distances.get(`${current.column}:${current.row}`) ?? 0;

    for (const direction of directions) {
      const column = current.column + direction.dc;
      const row = current.row + direction.dr;
      const key = `${column}:${row}`;

      if (!MAZE_WALKABLE_CELLS.has(key) || distances.has(key)) continue;
      distances.set(key, currentDistance + 1);
      queue.push({ column, row });
    }
  }

  const reachable = queue.filter((cell) => {
    const insideEntrance =
      cell.column >= 39 &&
      cell.column <= 42 &&
      cell.row >= 72;
    const nearCenter =
      cell.column >= CENTER_ROOM.left - 3 &&
      cell.column <= CENTER_ROOM.right + 3 &&
      cell.row >= CENTER_ROOM.top - 3 &&
      cell.row <= CENTER_ROOM.bottom + 7;
    return !insideEntrance && !nearCenter;
  });

  const maxDistance = reachable.reduce((max, cell) => (
    Math.max(max, distances.get(`${cell.column}:${cell.row}`) ?? 0)
  ), 1);

  const definitions: Array<{
    id: MazeLandmarkId;
    label: string;
    color: number;
    ratio: number;
  }> = [
    // La falsa bifurcación se fija después en una intersección natural del
    // laberinto. La rama este parece continuar hacia el objetivo, pero recorre
    // un ramal largo y termina en un callejón sin salida, obligando a volver.
    { id: 'blackSun', label: 'SOL NEGRO', color: 0x33233f, ratio: 0.16 },
    { id: 'falseBranch', label: 'FALSA BIFURCACIÓN', color: 0x9a6f32, ratio: 0.31 },
    { id: 'carpetPit', label: 'AGUJERO / ALFOMBRA', color: 0x51362b, ratio: 0.47 },
    { id: 'movingWalls', label: 'MUROS MÓVILES', color: 0x6e6b63, ratio: 0.63 },
    { id: 'sacredBrazier', label: 'BRASERO SAGRADO', color: 0xe2752f, ratio: 0.79 },
    { id: 'statueCorridor', label: 'ESTATUAS LANZADORAS', color: 0x7b5543, ratio: 0.94 }
  ];

  const selected = new Set<string>();

  return definitions.map((definition) => {
    if (definition.id === 'falseBranch') {
      return {
        id: definition.id,
        label: definition.label,
        color: definition.color,
        column: FALSE_BRANCH_JUNCTION.column,
        row: FALSE_BRANCH_JUNCTION.row
      };
    }

    if (definition.id === 'blackSun') {
      return {
        id: definition.id,
        label: definition.label,
        color: definition.color,
        column: BLACK_SUN_GATE.columns[0],
        row: BLACK_SUN_GATE.rows[0]
      };
    }

    if (definition.id === 'sacredBrazier') {
      return {
        id: definition.id,
        label: definition.label,
        color: definition.color,
        column: SACRED_BRAZIER_POSITION.column,
        row: SACRED_BRAZIER_POSITION.rows[0]
      };
    }

    if (definition.id === 'carpetPit') {
      return {
        id: definition.id,
        label: definition.label,
        color: definition.color,
        column: CARPET_PIT_POSITION.column,
        row: CARPET_PIT_POSITION.rows[0]
      };
    }

    const target = maxDistance * definition.ratio;
    let best = reachable[0];
    let bestDelta = Number.POSITIVE_INFINITY;

    for (const cell of reachable) {
      const key = `${cell.column}:${cell.row}`;
      if (selected.has(key)) continue;

      const distance = distances.get(key) ?? 0;
      const delta = Math.abs(distance - target);

      if (delta < bestDelta) {
        best = cell;
        bestDelta = delta;
      }
    }

    selected.add(`${best.column}:${best.row}`);

    return {
      id: definition.id,
      label: definition.label,
      color: definition.color,
      column: best.column,
      row: best.row
    };
  });
}

const MAZE_LANDMARKS = findMazeLandmarkCells();

function findScorpionCrackCells(): Array<{ column: number; row: number }> {
  const brazier = MAZE_LANDMARKS.find((item) => item.id === 'sacredBrazier');
  const statues = MAZE_LANDMARKS.find((item) => item.id === 'statueCorridor');
  if (!brazier || !statues) return [];

  type Cell = { column: number; row: number };
  const start: Cell = { column: brazier.column, row: brazier.row };
  const targetKey = `${statues.column}:${statues.row}`;
  const queue: Cell[] = [start];
  const previous = new Map<string, string | null>([
    [`${start.column}:${start.row}`, null]
  ]);
  let cursor = 0;

  const directions = [
    { dc: 1, dr: 0 },
    { dc: -1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: 0, dr: -1 }
  ] as const;

  while (cursor < queue.length) {
    const current = queue[cursor];
    cursor += 1;
    const currentKey = `${current.column}:${current.row}`;

    if (currentKey === targetKey) break;

    for (const direction of directions) {
      const column = current.column + direction.dc;
      const row = current.row + direction.dr;
      const key = `${column}:${row}`;

      if (!MAZE_WALKABLE_CELLS.has(key) || previous.has(key)) continue;

      previous.set(key, currentKey);
      queue.push({ column, row });
    }
  }

  if (!previous.has(targetKey)) return [];

  // Reconstruimos el camino real Brasero -> Estatuas. Así las grietas quedan
  // obligatoriamente sobre una ruta alcanzable y no en componentes aislados.
  const path: Cell[] = [];
  let key: string | null = targetKey;

  while (key) {
    const [columnText, rowText] = key.split(':');
    path.push({
      column: Number(columnText),
      row: Number(rowText)
    });
    key = previous.get(key) ?? null;
  }

  path.reverse();

  const ratios = [0.25, 0.5, 0.75] as const;
  return ratios.map((ratio) => {
    const index = Phaser.Math.Clamp(
      Math.round((path.length - 1) * ratio),
      1,
      Math.max(1, path.length - 2)
    );
    return path[index];
  });
}

const MAZE_SCORPION_CRACKS = findScorpionCrackCells();

interface StatueLauncherSite {
  column: number;
  row: number;
  directionX: -1 | 0 | 1;
  directionY: -1 | 0 | 1;
}

function findStatueLauncherSites(): StatueLauncherSite[] {
  const brazier = MAZE_LANDMARKS.find((item) => item.id === 'sacredBrazier');
  if (!brazier) return [];

  type Cell = { column: number; row: number };
  const startKey = `${brazier.column}:${brazier.row}`;
  const queue: Cell[] = [{ column: brazier.column, row: brazier.row }];
  const previous = new Map<string, string | null>([[startKey, null]]);
  let cursor = 0;

  const directions = [
    { dc: 1, dr: 0 },
    { dc: -1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: 0, dr: -1 }
  ] as const;

  // Buscamos dentro del componente realmente alcanzable desde el Brasero el
  // punto que más se aproxima a la antesala final. No usamos el antiguo
  // landmark de estatuas porque podía caer en un callejón sin salida.
  let best: Cell = queue[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  while (cursor < queue.length) {
    const current = queue[cursor];
    cursor += 1;

    const distanceToFinal =
      Math.abs(current.column - 40) + Math.abs(current.row - 52);

    const nearSealedCenter =
      current.column >= CENTER_ROOM.left - 2 &&
      current.column <= CENTER_ROOM.right + 2 &&
      current.row >= CENTER_ROOM.top - 2 &&
      current.row <= CENTER_ROOM.bottom + 7;

    if (!nearSealedCenter && distanceToFinal < bestDistance) {
      best = current;
      bestDistance = distanceToFinal;
    }

    for (const direction of directions) {
      const column = current.column + direction.dc;
      const row = current.row + direction.dr;
      const key = `${column}:${row}`;

      if (!MAZE_WALKABLE_CELLS.has(key) || previous.has(key)) continue;
      previous.set(key, `${current.column}:${current.row}`);
      queue.push({ column, row });
    }
  }

  const path: Cell[] = [];
  let key: string | null = `${best.column}:${best.row}`;

  while (key) {
    const [columnText, rowText] = key.split(':');
    path.push({ column: Number(columnText), row: Number(rowText) });
    key = previous.get(key) ?? null;
  }

  path.reverse();

  const isOpen = (column: number, row: number): boolean =>
    MAZE_WALKABLE_CELLS.has(`${column}:${row}`);

  const candidates: Array<StatueLauncherSite & { pathIndex: number }> = [];

  for (let index = 1; index < path.length - 1; index += 1) {
    const cell = path[index];

    // Pasillo vertical de 2 celdas de ancho:
    // pared | libre | libre | pared. Una sola estatua en una pared dispara
    // hasta perder el proyectil en la pared opuesta.
    if (
      !isOpen(cell.column - 1, cell.row) &&
      isOpen(cell.column, cell.row) &&
      isOpen(cell.column + 1, cell.row) &&
      !isOpen(cell.column + 2, cell.row)
    ) {
      candidates.push({
        column: cell.column - 1,
        row: cell.row,
        directionX: 1,
        directionY: 0,
        pathIndex: index
      });
      continue;
    }

    if (
      !isOpen(cell.column + 1, cell.row) &&
      isOpen(cell.column, cell.row) &&
      isOpen(cell.column - 1, cell.row) &&
      !isOpen(cell.column - 2, cell.row)
    ) {
      candidates.push({
        column: cell.column + 1,
        row: cell.row,
        directionX: -1,
        directionY: 0,
        pathIndex: index
      });
      continue;
    }

    // Pasillo horizontal de 2 celdas de alto.
    if (
      !isOpen(cell.column, cell.row - 1) &&
      isOpen(cell.column, cell.row) &&
      isOpen(cell.column, cell.row + 1) &&
      !isOpen(cell.column, cell.row + 2)
    ) {
      candidates.push({
        column: cell.column,
        row: cell.row - 1,
        directionX: 0,
        directionY: 1,
        pathIndex: index
      });
      continue;
    }

    if (
      !isOpen(cell.column, cell.row + 1) &&
      isOpen(cell.column, cell.row) &&
      isOpen(cell.column, cell.row - 1) &&
      !isOpen(cell.column, cell.row - 2)
    ) {
      candidates.push({
        column: cell.column,
        row: cell.row + 1,
        directionX: 0,
        directionY: -1,
        pathIndex: index
      });
    }
  }

  if (candidates.length === 0) return [];

  const desired = 5;
  const selected: StatueLauncherSite[] = [];

  for (let slot = 0; slot < desired; slot += 1) {
    const targetIndex =
      ((slot + 1) / (desired + 1)) * Math.max(1, path.length - 1);

    let bestCandidate: (typeof candidates)[number] | undefined;
    let bestDelta = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
      const tooClose = selected.some((site) =>
        Math.abs(site.column - candidate.column) +
        Math.abs(site.row - candidate.row) < 8
      );
      if (tooClose) continue;

      const delta = Math.abs(candidate.pathIndex - targetIndex);
      if (delta < bestDelta) {
        bestCandidate = candidate;
        bestDelta = delta;
      }
    }

    if (bestCandidate) {
      selected.push({
        column: bestCandidate.column,
        row: bestCandidate.row,
        directionX: bestCandidate.directionX,
        directionY: bestCandidate.directionY
      });
    }
  }

  return selected;
}

const MAZE_STATUE_LAUNCHERS = findStatueLauncherSites();

const POST_FRAGMENT_STATUE_LAUNCHERS: StatueLauncherSite[] = [
  { column: 42, row: 19, directionX: 0, directionY: 1 },
  { column: 75, row: 23, directionX: 1, directionY: 0 },
  { column: 19, row: 15, directionX: 1, directionY: 0 },
  { column: 10, row: 44, directionX: -1, directionY: 0 }
];

export class MazeScene extends Phaser.Scene {
  private characterId: CharacterId = 'tiana';
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private ui!: PlayableUiController;
  private facing: Facing = 'up';
  private exiting = false;
  private exitLockedHintShown = false;
  private blackSunActivated = false;
  private blackSunObject?: Phaser.GameObjects.Container;
  private darknessOverlay?: Phaser.GameObjects.Graphics;
  private carpetPit?: Phaser.GameObjects.Ellipse;
  private carpetOnPit?: Phaser.GameObjects.Rectangle;
  private carpetPitHintShown = false;
  private movingWallPhase = 0;
  private movingWallSolved = false;
  private movingWallReleasePending = false;
  private movingWallObjects = new Map<string, Phaser.GameObjects.Image>();
  private movingWallBlockedCells = new Set<string>();
  private sacredBrazierLit = false;
  private scorpions: Phaser.Physics.Arcade.Sprite[] = [];
  private activatedScorpionCracks = new Set<string>();
  private statueProjectiles: Phaser.GameObjects.Image[] = [];
  private nextStatueShotAt = 0;
  private statueShotIndex = 0;
  private blackSunTriggeredEver = false;
  private finalGateOpen = false;
  private finalGateVisual?: Phaser.GameObjects.Rectangle;
  private finalGateLabel?: Phaser.GameObjects.Text;
  private fragmentObject?: Phaser.GameObjects.Container;
  private fragmentHintShown = false;
  private postFragmentRouteActive = false;
  private postFragmentSouthGate?: Phaser.GameObjects.Rectangle;
  private secondBlackSunObject?: Phaser.GameObjects.Container;
  private secondBlackSunTriggered = false;
  private secondSacredBrazierLit = false;
  private postFragmentScorpionsSpawned = new Set<string>();
  private isGameOver = false;

  constructor() {
    super('MazeScene');
  }

  init(data: MazeSceneData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.facing = 'up';
    this.exiting = false;
    this.exitLockedHintShown = false;
    this.blackSunActivated = false;
    this.blackSunObject = undefined;
    this.darknessOverlay = undefined;
    this.carpetPit = undefined;
    this.carpetOnPit = undefined;
    this.carpetPitHintShown = false;
    this.movingWallPhase = 0;
    this.movingWallSolved = false;
    this.movingWallReleasePending = false;
    this.movingWallObjects.clear();
    this.movingWallBlockedCells.clear();
    this.sacredBrazierLit = false;
    this.scorpions = [];
    this.activatedScorpionCracks.clear();
    this.statueProjectiles = [];
    this.nextStatueShotAt = 0;
    this.statueShotIndex = 0;
    this.blackSunTriggeredEver = false;
    this.finalGateOpen = getVillageProgress().desertFragmentObtained;
    this.finalGateVisual = undefined;
    this.finalGateLabel = undefined;
    this.fragmentObject = undefined;
    this.fragmentHintShown = false;
    this.postFragmentRouteActive = getVillageProgress().desertFragmentObtained;
    this.postFragmentSouthGate = undefined;
    this.secondBlackSunObject = undefined;
    this.secondBlackSunTriggered = false;
    this.secondSacredBrazierLit = false;
    this.postFragmentScorpionsSpawned.clear();
    this.isGameOver = false;
  }

  preload(): void {
    preloadPlayableUiAssets(this);

    this.load.image(
      'maze-temple-grey-tile',
      './assets/world/desert/desert-temple/objects/temple-grey-tile.png'
    );
    this.load.image(
      'maze-temple-grey-tile-broken',
      './assets/world/desert/desert-temple/objects/temple-grey-tile-broken.png'
    );
    this.load.image(
      'maze-static-stone-block',
      './assets/world/desert/desert-temple/walls/desert-stone-block-01.png'
    );
    this.load.image(
      'maze-shoot-down-block',
      './assets/world/desert/desert-temple/walls/desert-stone-block-shoot-down.png'
    );
    this.load.image(
      'maze-shoot-right-block',
      './assets/world/desert/desert-temple/walls/desert-stone-block-shoot-right.png'
    );
    this.load.image(
      'maze-moving-stone-block',
      './assets/world/desert/desert-temple/walls/desert-stone-block-02.png'
    );

    this.load.image(
      'maze-scorpion-down-01',
      './assets/world/desert/enemies/scorpions/escorpion_down_01.png'
    );
    this.load.image(
      'maze-scorpion-up-01',
      './assets/world/desert/enemies/scorpions/escorpion_up_01.png'
    );

    this.load.image(
      'maze-black-sun',
      './assets/world/desert/desert-temple/objects/black-sun.png'
    );

    this.load.image(
      'maze-fireball',
      './assets/world/desert/desert-temple/objects/fireball.png'
    );

    this.load.image(
      'maze-solar-altar',
      './assets/world/desert/desert-temple/objects/altar-solar.png'
    );

    this.load.image(
      'maze-sacred-brazier',
      './assets/world/desert/desert-temple/objects/brasero-sagrado.png'
    );

    const assets = CHARACTER_ASSETS[this.characterId === 'lupe' ? 'lupe' : 'tiana'];
    Object.entries(assets).forEach(([key, path]) => {
      this.load.image(`maze-player-${key}`, path);
    });
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#6e4a2b');

    this.createFloorAndWalls();
    this.createCenterChamberMarker();
    this.createFinalGate();
    this.createDesertFragment();
    this.createPostFragmentRouteVisuals();
    this.createSecondBlackSun();
    this.createSecondSacredBrazier();
    this.createLandmarkMarkers();
    this.createPlayer();
    this.createBlackSun();
    this.createCarpetPit();
    this.createMovingWalls();
    this.createSacredBrazier();
    this.createScorpionCracks();
    this.createStatueCorridor();
    this.createPlayerAnimations();
    this.createGridGuide();

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.fadeIn(300, 8, 5, 2);

    // TEMPORAL durante las pruebas del laberinto: siempre entramos con una
    // alfombra disponible para poder validar el agujero sin repetir la tienda.
    grantDesertCarpetForMazeTest();

    const progress = getVillageProgress();
    const character =
      characters.find((item) => item.id === this.characterId) ?? characters[0];

    this.ui = createPlayableUi(
      this,
      this.characterId,
      character.name,
      progress.energy,
      progress.coins,
      { carpetOwned: hasUsableDesertCarpet() }
    );
  }

  update(time: number, delta: number): void {
    if (this.exiting || this.isGameOver) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let x = 0;
    let y = 0;

    if (this.cursors.left.isDown || this.ui.touchDirections.left) x -= 1;
    if (this.cursors.right.isDown || this.ui.touchDirections.right) x += 1;
    if (this.cursors.up.isDown || this.ui.touchDirections.up) y -= 1;
    if (this.cursors.down.isDown || this.ui.touchDirections.down) y += 1;

    if (x !== 0 || y !== 0) {
      const movement = new Phaser.Math.Vector2(x, y).normalize();
      const safeDelta = Math.min(delta, 50);
      const distance = PLAYER_SPEED * (safeDelta / 1000);

      const moved = this.movePlayerWithinWalkableGrid(
        movement.x * distance,
        movement.y * distance
      );

      if (Math.abs(movement.x) > Math.abs(movement.y)) {
        this.facing = 'side';
        this.player.setFlipX(movement.x < 0);
      } else if (movement.y < 0) {
        this.facing = 'up';
        this.player.setFlipX(false);
      } else {
        this.facing = 'down';
        this.player.setFlipX(false);
      }

      if (moved) {
        this.player.anims.play(`maze-walk-${this.facing}`, true);
      } else {
        this.player.anims.stop();
        this.player.setTexture(
          `maze-player-${this.facing === 'side' ? 'side' : this.facing}`
        );
      }

      if (movement.y > 0) this.checkExit();
    } else {
      this.player.anims.stop();
      this.player.setTexture(
        `maze-player-${this.facing === 'side' ? 'side' : this.facing}`
      );
    }

    this.player.setDepth(this.player.y + PLAYER_FOOT_OFFSET_Y);
    this.checkBlackSunActivation();
    this.checkCarpetPitInteraction();
    this.checkMovingWallTriggers();
    this.checkMovingWallReleaseOutOfView();
    this.checkSacredBrazier();
    this.updateScorpionCracks(time, delta);
    this.updateStatueCorridor(time, delta);
    this.checkFinalGateUnlock();
    this.checkDesertFragmentInteraction();
    this.checkSecondBlackSunActivation();
    this.checkSecondSacredBrazier();
    this.updatePostFragmentThreats(time);
    this.updateDarknessMask();
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(
      PLAYER_START.x,
      PLAYER_START.y,
      'maze-player-up'
    );

    this.player
      .setDisplaySize(PLAYER_SIZE, PLAYER_SIZE)
      .setDepth(PLAYER_START.y + PLAYER_FOOT_OFFSET_Y)
      .setCollideWorldBounds(true);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(28, 24).setOffset(18, 36);
    body.setAllowGravity(false);
  }

  private createPlayerAnimations(): void {
    const make = (key: Facing, frames: string[], frameRate: number): void => {
      const animationKey = `maze-walk-${key}`;
      if (this.anims.exists(animationKey)) this.anims.remove(animationKey);

      this.anims.create({
        key: animationKey,
        frames: frames.map((textureKey) => ({ key: textureKey })),
        frameRate,
        repeat: -1
      });
    };

    make('down', ['maze-player-down1', 'maze-player-down2'], 6);
    make('up', ['maze-player-up1', 'maze-player-up2'], 6);
    make(
      'side',
      [
        'maze-player-side1',
        'maze-player-side',
        'maze-player-side2',
        'maze-player-side'
      ],
      8
    );
  }

  private isWalkableFootPoint(spriteX: number, spriteY: number): boolean {
    const footX = spriteX;
    const footY = spriteY + PLAYER_FOOT_OFFSET_Y;

    if (
      footX < 0 ||
      footX >= WORLD_WIDTH ||
      footY < 0 ||
      footY >= WORLD_HEIGHT
    ) {
      return false;
    }

    const column = Math.floor(footX / GRID_SIZE) + 1;
    const row = Math.floor(footY / GRID_SIZE) + 1;

    if (!MAZE_WALKABLE_CELLS.has(`${column}:${row}`)) return false;
    if (this.movingWallBlockedCells.has(`${column}:${row}`)) return false;

    if (
      (!this.finalGateOpen || this.postFragmentRouteActive) &&
      row === FINAL_GATE_ROW &&
      FINAL_GATE_COLUMNS.includes(
        column as (typeof FINAL_GATE_COLUMNS)[number]
      )
    ) {
      return false;
    }

    if (
      !this.postFragmentRouteActive &&
      row === NORTH_GATE_ROW &&
      NORTH_GATE_COLUMNS.includes(
        column as (typeof NORTH_GATE_COLUMNS)[number]
      )
    ) {
      return false;
    }

    if (
      !this.postFragmentRouteActive &&
      RETURN_BRIDGE_ROWS.includes(
        row as (typeof RETURN_BRIDGE_ROWS)[number]
      ) &&
      RETURN_BRIDGE_COLUMNS.includes(
        column as (typeof RETURN_BRIDGE_COLUMNS)[number]
      )
    ) {
      return false;
    }

    const pit = MAZE_LANDMARKS.find((item) => item.id === 'carpetPit');
    if (pit && !getVillageProgress().desertCarpetUsedInMaze) {
      const pitX = (CARPET_PIT_POSITION.column - 0.5) * GRID_SIZE;
      const pitFirstY =
        (CARPET_PIT_POSITION.rows[0] - 0.5) * GRID_SIZE;
      const pitSecondY =
        (CARPET_PIT_POSITION.rows[1] - 0.5) * GRID_SIZE;
      const pitY = (pitFirstY + pitSecondY) / 2;

      if (
        Phaser.Math.Distance.Between(footX, footY, pitX, pitY) <
        CARPET_PIT_BLOCK_RADIUS
      ) {
        return false;
      }
    }

    return true;
  }

  private movePlayerWithinWalkableGrid(dx: number, dy: number): boolean {
    const maxStep = 4;
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / maxStep)
    );
    const stepX = dx / steps;
    const stepY = dy / steps;
    let moved = false;

    for (let index = 0; index < steps; index += 1) {
      const nextX = this.player.x + stepX;
      if (this.isWalkableFootPoint(nextX, this.player.y)) {
        this.player.x = nextX;
        moved = true;
      }

      const nextY = this.player.y + stepY;
      if (this.isWalkableFootPoint(this.player.x, nextY)) {
        this.player.y = nextY;
        moved = true;
      }
    }

    return moved;
  }

  private createFloorAndWalls(): void {
    // Una textura de 32x32 por bloque; las paredes tapan las celdas sólidas.
    const groundFrame = this.textures.get('maze-temple-grey-tile').get();
    this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'maze-temple-grey-tile')
      .setOrigin(0, 0)
      .setTileScale(GRID_SIZE / groundFrame.width, GRID_SIZE / groundFrame.height)
      .setDepth(0);

    for (let row = 1; row <= WORLD_ROWS; row += 1) {
      for (let column = 1; column <= WORLD_COLUMNS; column += 1) {
        const key = `${column}:${row}`;
        const x = (column - 1) * GRID_SIZE;
        const y = (row - 1) * GRID_SIZE;

        if (MAZE_WALKABLE_CELLS.has(key)) continue;

        // Cada celda no transitable se construye ahora con una única piedra
        // modular. El footprint lógico sigue siendo exactamente 32x32, por lo
        // que no cambia ninguna colisión ni la geometría del laberinto.
        this.add.image(
          x + GRID_SIZE / 2,
          y + GRID_SIZE / 2,
          'maze-static-stone-block'
        )
          .setDisplaySize(GRID_SIZE, GRID_SIZE)
          .setDepth(50);
      }
    }
  }


  private createLandmarkMarkers(): void {
    for (const landmark of MAZE_LANDMARKS) {
      if (
        landmark.id === 'blackSun' ||
        landmark.id === 'falseBranch' ||
        landmark.id === 'carpetPit' ||
        landmark.id === 'movingWalls' ||
        landmark.id === 'sacredBrazier' ||
        landmark.id === 'statueCorridor'
      ) continue;

      const x = (landmark.column - 0.5) * GRID_SIZE;
      const y = (landmark.row - 0.5) * GRID_SIZE;

      this.add.circle(x, y, 18, landmark.color, 0.82)
        .setStrokeStyle(3, 0xffe4a0, 0.9)
        .setDepth(120);

      this.add.text(x, y - 26, landmark.label, {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: '#fff3c4',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: 'rgba(35, 22, 14, 0.82)',
        padding: { x: 5, y: 3 }
      })
        .setOrigin(0.5, 1)
        .setDepth(121);
    }

  }

  private createCarpetPit(): void {
    const landmark = MAZE_LANDMARKS.find((item) => item.id === 'carpetPit');
    if (!landmark) return;

    const x = (CARPET_PIT_POSITION.column - 0.5) * GRID_SIZE;
    const firstRowCenter =
      (CARPET_PIT_POSITION.rows[0] - 0.5) * GRID_SIZE;
    const secondRowCenter =
      (CARPET_PIT_POSITION.rows[1] - 0.5) * GRID_SIZE;
    const y = (firstRowCenter + secondRowCenter) / 2;

    if (getVillageProgress().desertCarpetUsedInMaze) {
      this.placeCarpetOverPit(x, y);
      return;
    }

    const shadow = this.add.ellipse(x, y + 4, 78, 54, 0x1b100b, 0.68)
      .setDepth(116);
    this.carpetPit = this.add.ellipse(x, y, 70, 46, 0x050302, 1)
      .setStrokeStyle(4, 0x51362b, 1)
      .setDepth(117);

    this.add.ellipse(x, y - 2, 52, 30, 0x000000, 0.72)
      .setDepth(118);

    this.add.text(x, y - 34, 'AGUJERO', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffe3b7',
      fontStyle: 'bold',
      backgroundColor: 'rgba(28, 16, 10, 0.82)',
      padding: { x: 5, y: 3 }
    })
      .setOrigin(0.5, 1)
      .setDepth(119);

    shadow.setData('mazePitVisual', true);
  }

  private checkCarpetPitInteraction(): void {
    const landmark = MAZE_LANDMARKS.find((item) => item.id === 'carpetPit');
    if (!landmark || getVillageProgress().desertCarpetUsedInMaze) return;

    const x = (CARPET_PIT_POSITION.column - 0.5) * GRID_SIZE;
    const firstRowCenter =
      (CARPET_PIT_POSITION.rows[0] - 0.5) * GRID_SIZE;
    const secondRowCenter =
      (CARPET_PIT_POSITION.rows[1] - 0.5) * GRID_SIZE;
    const y = (firstRowCenter + secondRowCenter) / 2;
    const footY = this.player.y + PLAYER_FOOT_OFFSET_Y;
    const distance = Phaser.Math.Distance.Between(this.player.x, footY, x, y);

    if (distance > CARPET_PIT_USE_RADIUS) {
      if (this.carpetPitHintShown) {
        this.carpetPitHintShown = false;
        this.ui.updateStatus('');
      }
      return;
    }

    if (!hasUsableDesertCarpet()) {
      if (!this.carpetPitHintShown) {
        this.carpetPitHintShown = true;
        this.ui.updateStatus('El agujero bloquea el paso. Necesitas una alfombra.');
      }
      return;
    }

    if (!this.carpetPitHintShown) {
      this.carpetPitHintShown = true;
      this.ui.updateStatus('Pulsa ESPACIO para cubrir el agujero con la alfombra.');
    }

    if (!Phaser.Input.Keyboard.JustDown(this.cursors.space!)) return;

    if (!useDesertCarpetInMaze()) return;

    this.ui.updateCarpetOwned(false);
    this.ui.updateStatus('La alfombra cubre el agujero. Ya puedes cruzar.');
    this.placeCarpetOverPit(x, y);

    this.time.delayedCall(2200, () => {
      if (this.scene.isActive()) this.ui.updateStatus('');
    });
  }

  private placeCarpetOverPit(x: number, y: number): void {
    this.carpetPit?.destroy();
    this.carpetPit = undefined;

    if (this.carpetOnPit) return;

    this.carpetOnPit = this.add.rectangle(x, y, 74, 50, 0xb73931, 1)
      .setStrokeStyle(4, 0xe4c269, 1)
      .setAngle(-4)
      .setDepth(119);

    this.add.rectangle(x, y, 58, 34, 0x7d2524, 1)
      .setStrokeStyle(2, 0xf0d483, 0.9)
      .setAngle(-4)
      .setDepth(120);
  }

  private createMovingWalls(): void {
    const landmark = MAZE_LANDMARKS.find((item) => item.id === 'movingWalls');
    if (!landmark) return;

    // Esta zona forma una pequeña cámara de paso:
    // 1) al entrar, se cierra el acceso anterior y se abre el lateral;
    // 2) al alcanzar el giro, el lateral se cierra y se abre el paso norte;
    // 3) al salir de la zona, los muros quedan abiertos para permitir regreso.
    this.setMovingWallPhase(0, false);

    const x = (landmark.column - 0.5) * GRID_SIZE;
    const y = (landmark.row - 0.5) * GRID_SIZE;

    this.add.text(x + GRID_SIZE, y - 42, 'MUROS MÓVILES', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#eee8dc',
      fontStyle: 'bold',
      backgroundColor: 'rgba(47, 43, 39, 0.84)',
      padding: { x: 5, y: 3 }
    })
      .setOrigin(0.5, 1)
      .setDepth(128);
  }

  private movingWallCellsForPhase(): {
    first: Array<{ column: number; row: number }>;
    second: Array<{ column: number; row: number }>;
  } {
    return {
      // Primer cierre: atraviesa por completo el corredor vertical C68-C69
      // justo después de que el jugador haya girado hacia el este.
      first: [
        { column: 68, row: 55 },
        { column: 69, row: 55 }
      ],
      // Segundo cierre: bastante más adelante, atraviesa por completo el
      // corredor horizontal F52-F53 después del siguiente giro.
      second: [
        { column: 74, row: 52 },
        { column: 74, row: 53 }
      ]
    };
  }

  private setMovingWallPhase(phase: number, animate = true): void {
    this.movingWallPhase = phase;

    const cells = this.movingWallCellsForPhase();
    let blocked: Array<{ column: number; row: number }> = [];

    if (!this.movingWallSolved) {
      if (phase === 1) blocked = [...cells.first];
      else if (phase === 2) blocked = [...cells.first, ...cells.second];
    }

    const nextKeys = new Set(blocked.map((cell) => `${cell.column}:${cell.row}`));

    for (const [key, wall] of this.movingWallObjects) {
      if (nextKeys.has(key)) continue;

      if (animate) {
        this.tweens.add({
          targets: wall,
          scaleY: 0.08,
          alpha: 0,
          duration: 260,
          ease: 'Sine.easeIn',
          onComplete: () => wall.destroy()
        });
      } else {
        wall.destroy();
      }
      this.movingWallObjects.delete(key);
    }

    for (const cell of blocked) {
      const key = `${cell.column}:${cell.row}`;
      if (this.movingWallObjects.has(key)) continue;

      const x = (cell.column - 0.5) * GRID_SIZE;
      const y = (cell.row - 0.5) * GRID_SIZE;
      const wall = this.add.image(
        x,
        y,
        'maze-moving-stone-block'
      )
        .setDisplaySize(GRID_SIZE, GRID_SIZE)
        .setDepth(132);

      wall.setScale(wall.scaleX, animate ? wall.scaleY * 0.08 : wall.scaleY);
      wall.setAlpha(animate ? 0 : 1);
      this.movingWallObjects.set(key, wall);

      if (animate) {
        const targetScaleY = wall.scaleX;
        this.tweens.add({
          targets: wall,
          scaleY: targetScaleY,
          alpha: 1,
          duration: 300,
          ease: 'Sine.easeOut'
        });
      }
    }

    this.movingWallBlockedCells = nextKeys;
  }

  private checkMovingWallTriggers(): void {
    if (this.movingWallSolved) return;

    const footY = this.player.y + PLAYER_FOOT_OFFSET_Y;
    const near = (column: number, row: number): boolean => {
      const x = (column - 0.5) * GRID_SIZE;
      const y = (row - 0.5) * GRID_SIZE;
      return Phaser.Math.Distance.Between(
        this.player.x,
        footY,
        x,
        y
      ) <= MOVING_WALL_TRIGGER_RADIUS;
    };

    if (
      this.movingWallPhase === 0 &&
      (near(71, 56) || near(72, 56) || near(71, 57) || near(72, 57))
    ) {
      // El jugador ya ha abandonado el corredor vertical C68-C69:
      // cerramos ambas celdas de ancho detrás de él.
      this.setMovingWallPhase(1);
      this.cameras.main.shake(180, 0.003);
      this.ui.updateStatus('Un muro ha cerrado completamente el paso a tu espalda.');
      this.time.delayedCall(1500, () => {
        if (this.scene.isActive()) this.ui.updateStatus('');
      });
      return;
    }

    if (
      this.movingWallPhase === 1 &&
      (near(76, 50) || near(77, 50) || near(76, 51) || near(77, 51))
    ) {
      // El segundo cierre ocurre bastante más adelante, cuando ya hemos
      // recorrido el tramo este y girado hacia el norte.
      this.setMovingWallPhase(2);
      this.movingWallReleasePending = true;
      this.cameras.main.shake(180, 0.003);
      this.ui.updateStatus('Otro muro se ha cerrado lejos, detrás de ti.');
      this.time.delayedCall(1500, () => {
        if (this.scene.isActive()) this.ui.updateStatus('');
      });
    }
  }

  private checkMovingWallReleaseOutOfView(): void {
    if (
      !this.movingWallReleasePending ||
      this.movingWallSolved
    ) {
      return;
    }

    const zone = new Phaser.Geom.Rectangle(
      (67 - 1) * GRID_SIZE,
      (49 - 1) * GRID_SIZE,
      11 * GRID_SIZE,
      9 * GRID_SIZE
    );

    const worldView = this.cameras.main.worldView;
    if (Phaser.Geom.Intersects.RectangleToRectangle(zone, worldView)) return;

    this.movingWallReleasePending = false;
    this.movingWallSolved = true;
    this.setMovingWallPhase(3, false);
  }

  private createSacredBrazier(): void {
    const landmark = MAZE_LANDMARKS.find((item) => item.id === 'sacredBrazier');
    if (!landmark) return;

    const x = (SACRED_BRAZIER_POSITION.column - 0.5) * GRID_SIZE;
    const firstRowCenter =
      (SACRED_BRAZIER_POSITION.rows[0] - 0.5) * GRID_SIZE;
    const secondRowCenter =
      (SACRED_BRAZIER_POSITION.rows[1] - 0.5) * GRID_SIZE;
    const y = (firstRowCenter + secondRowCenter) / 2;

    this.add.image(x, y, 'maze-sacred-brazier')
      .setDisplaySize(GRID_SIZE, GRID_SIZE)
      .setDepth(125);

    this.add.text(x, y - 38, 'BRASERO SAGRADO', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffe4b8',
      fontStyle: 'bold',
      backgroundColor: 'rgba(44, 25, 14, 0.84)',
      padding: { x: 5, y: 3 }
    })
      .setOrigin(0.5, 1)
      .setDepth(128);

  }

  private checkSacredBrazier(): void {
    if (this.sacredBrazierLit || !this.blackSunActivated) return;

    const landmark = MAZE_LANDMARKS.find((item) => item.id === 'sacredBrazier');
    if (!landmark) return;

    const x = (SACRED_BRAZIER_POSITION.column - 0.5) * GRID_SIZE;
    const firstRowCenter =
      (SACRED_BRAZIER_POSITION.rows[0] - 0.5) * GRID_SIZE;
    const secondRowCenter =
      (SACRED_BRAZIER_POSITION.rows[1] - 0.5) * GRID_SIZE;
    const y = (firstRowCenter + secondRowCenter) / 2;
    const footY = this.player.y + PLAYER_FOOT_OFFSET_Y;

    if (
      Phaser.Math.Distance.Between(this.player.x, footY, x, y) >
      SACRED_BRAZIER_TRIGGER_RADIUS
    ) {
      return;
    }

    this.sacredBrazierLit = true;
    this.blackSunActivated = false;

    this.ui.updateStatus('El Brasero Sagrado ha devuelto la luz al laberinto.');
    this.cameras.main.flash(380, 255, 205, 110, false);

    if (this.darknessOverlay) {
      const overlay = this.darknessOverlay;
      this.tweens.killTweensOf(overlay);
      this.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 1100,
        ease: 'Sine.easeOut',
        onComplete: () => {
          overlay.destroy();
          if (this.darknessOverlay === overlay) {
            this.darknessOverlay = undefined;
          }
        }
      });
    }

    this.time.delayedCall(2600, () => {
      if (this.scene.isActive()) this.ui.updateStatus('');
    });
  }

  private createScorpionCrackTile(column: number, row: number): void {
    this.add.image(
      (column - 0.5) * GRID_SIZE,
      (row - 0.5) * GRID_SIZE,
      'maze-temple-grey-tile-broken'
    )
      .setDisplaySize(GRID_SIZE, GRID_SIZE)
      .setDepth(1);
  }

  private createScorpionCracks(): void {
    for (const crack of MAZE_SCORPION_CRACKS) {
      this.createScorpionCrackTile(crack.column, crack.row);
    }

    if (this.postFragmentRouteActive) {
      this.createPostFragmentScorpionCracks();
    }
  }

  private createPostFragmentScorpionCracks(): void {
    this.createScorpionCrackTile(60, 16);
    this.createScorpionCrackTile(5, 53);
  }

  private updateScorpionCracks(time: number, delta: number): void {
    const footY = this.player.y + PLAYER_FOOT_OFFSET_Y;

    for (const crack of MAZE_SCORPION_CRACKS) {
      const key = `${crack.column}:${crack.row}`;
      if (this.activatedScorpionCracks.has(key)) continue;

      const x = (crack.column - 0.5) * GRID_SIZE;
      const y = (crack.row - 0.5) * GRID_SIZE;

      if (
        Phaser.Math.Distance.Between(this.player.x, footY, x, y) >
        MAZE_SCORPION_TRIGGER_RADIUS
      ) {
        continue;
      }

      this.activatedScorpionCracks.add(key);
      this.spawnMazeScorpion(x, y, time);
    }

    const safeDelta = Math.min(delta, 50);
    const distance = MAZE_SCORPION_SPEED * (safeDelta / 1000);

    for (const scorpion of this.scorpions) {
      if (!scorpion.active) continue;

      const bornAt = scorpion.getData('bornAt') as number;
      if (time - bornAt >= MAZE_SCORPION_LIFETIME) {
        scorpion.destroy();
        continue;
      }

      const targetY = this.player.y + PLAYER_FOOT_OFFSET_Y;
      const direction = new Phaser.Math.Vector2(
        this.player.x - scorpion.x,
        targetY - scorpion.y
      );

      if (direction.lengthSq() > 1) {
        direction.normalize();
        this.moveScorpionWithinMaze(
          scorpion,
          direction.x * distance,
          direction.y * distance
        );

        if (direction.y < -0.2) {
          scorpion.setTexture('maze-scorpion-up-01');
        } else if (direction.y > 0.2) {
          scorpion.setTexture('maze-scorpion-down-01');
        } else {
          scorpion.setTexture(
            direction.x < 0
              ? 'maze-scorpion-up-01'
              : 'maze-scorpion-down-01'
          );
        }

        if (Math.abs(direction.x) > 0.2) {
          scorpion.setFlipX(direction.x < 0);
        }
      }

      scorpion.setDepth(scorpion.y + MAZE_SCORPION_SIZE / 2);

      const touching =
        Phaser.Math.Distance.Between(
          scorpion.x,
          scorpion.y,
          this.player.x,
          targetY
        ) <= 22;

      const wasTouching = scorpion.getData('touchingPlayer') === true;
      if (touching && !wasTouching) {
        this.damagePlayer(MAZE_SCORPION_DAMAGE);
      }
      scorpion.setData('touchingPlayer', touching);
    }

    this.scorpions = this.scorpions.filter((scorpion) => scorpion.active);
  }

  private spawnMazeScorpion(x: number, y: number, time: number): void {
    const scorpion = this.physics.add.sprite(
      x,
      y,
      'maze-scorpion-down-01'
    );

    scorpion
      .setDisplaySize(MAZE_SCORPION_SIZE, MAZE_SCORPION_SIZE)
      .setDepth(y + MAZE_SCORPION_SIZE / 2)
      .setAlpha(0)
      .setData('bornAt', time)
      .setData('touchingPlayer', false);

    const targetScaleX = scorpion.scaleX;
    const targetScaleY = scorpion.scaleY;
    scorpion.setScale(targetScaleX * 0.2, targetScaleY * 0.2);

    const body = scorpion.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(
      MAZE_SCORPION_SIZE * 0.72,
      MAZE_SCORPION_SIZE * 0.72,
      true
    );
    body.setVelocity(0, 0);

    this.scorpions.push(scorpion);

    this.tweens.add({
      targets: scorpion,
      alpha: 1,
      scaleX: targetScaleX,
      scaleY: targetScaleY,
      duration: 180,
      ease: 'Back.easeOut'
    });
  }

  private moveScorpionWithinMaze(
    scorpion: Phaser.Physics.Arcade.Sprite,
    dx: number,
    dy: number
  ): void {
    const maxStep = 3;
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / maxStep)
    );
    const stepX = dx / steps;
    const stepY = dy / steps;

    for (let index = 0; index < steps; index += 1) {
      const nextX = scorpion.x + stepX;
      if (this.isMazeGroundPointWalkable(nextX, scorpion.y)) {
        scorpion.x = nextX;
      }

      const nextY = scorpion.y + stepY;
      if (this.isMazeGroundPointWalkable(scorpion.x, nextY)) {
        scorpion.y = nextY;
      }
    }
  }

  private isMazeGroundPointWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return false;

    const column = Math.floor(x / GRID_SIZE) + 1;
    const row = Math.floor(y / GRID_SIZE) + 1;
    const key = `${column}:${row}`;

    return (
      MAZE_WALKABLE_CELLS.has(key) &&
      !this.movingWallBlockedCells.has(key)
    );
  }

  private damagePlayer(amount: number): void {
    const progress = getVillageProgress();
    const nextEnergy = Math.max(0, progress.energy - amount);

    setVillageEnergy(nextEnergy);
    this.ui.updateEnergy(nextEnergy);

    this.cameras.main.shake(170, 0.006);
    this.player.setTint(0xff5544);
    this.time.delayedCall(180, () => {
      if (this.player.active) this.player.clearTint();
    });

    if (nextEnergy > 0 || this.isGameOver) return;

    this.isGameOver = true;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);
    this.player.anims.stop();

    this.time.delayedCall(220, () => {
      this.scene.launch('GameOverScene', {
        characterId: this.characterId,
        sourceSceneKey: 'MazeScene'
      });
      this.scene.pause();
    });
  }

  private createStatueCorridor(): void {
    for (const site of [
      ...MAZE_STATUE_LAUNCHERS,
      ...POST_FRAGMENT_STATUE_LAUNCHERS
    ]) {
      this.createLauncherStatue(
        site.column,
        site.row,
        site.directionX,
        site.directionY
      );
    }
  }

  private createLauncherStatue(
    column: number,
    row: number,
    directionX: -1 | 0 | 1,
    directionY: -1 | 0 | 1
  ): void {
    // El disparo hacia arriba sale de la piedra normal: la boca queda oculta
    // por la perspectiva semicenital. No se superpone ninguna lanzadora.
    if (directionY === -1) return;

    const x = (column - 0.5) * GRID_SIZE;
    const y = (row - 0.5) * GRID_SIZE;
    const texture = directionY === 1
      ? 'maze-shoot-down-block'
      : 'maze-shoot-right-block';

    this.add.image(x, y, texture)
      .setDisplaySize(GRID_SIZE, GRID_SIZE)
      .setFlipX(directionX === -1)
      .setDepth(129);
  }

  private updateStatueCorridor(time: number, delta: number): void {
    const playerFootY = this.player.y + PLAYER_FOOT_OFFSET_Y;

    const activeSites = this.postFragmentRouteActive
      ? [...MAZE_STATUE_LAUNCHERS, ...POST_FRAGMENT_STATUE_LAUNCHERS]
      : MAZE_STATUE_LAUNCHERS;

    const nearbySites = activeSites.filter((site) => {
      const x = (site.column - 0.5) * GRID_SIZE;
      const y = (site.row - 0.5) * GRID_SIZE;
      return Phaser.Math.Distance.Between(
        this.player.x,
        playerFootY,
        x,
        y
      ) <= STATUE_ACTIVE_RADIUS;
    });

    if (nearbySites.length > 0 && time >= this.nextStatueShotAt) {
      const site = nearbySites[this.statueShotIndex % nearbySites.length];
      this.statueShotIndex += 1;
      this.nextStatueShotAt = time + STATUE_FIRE_INTERVAL;

      this.spawnStatueProjectile(
        site.column,
        site.row,
        site.directionX,
        site.directionY,
        time
      );
    }

    const safeDelta = Math.min(delta, 50);
    const travel = STATUE_PROJECTILE_SPEED * (safeDelta / 1000);

    for (const projectile of this.statueProjectiles) {
      if (!projectile.active) continue;

      const bornAt = projectile.getData('bornAt') as number;
      if (time - bornAt >= STATUE_PROJECTILE_LIFETIME) {
        projectile.destroy();
        continue;
      }

      const directionX = projectile.getData('directionX') as number;
      const directionY = projectile.getData('directionY') as number;
      projectile.x += directionX * travel;
      projectile.y += directionY * travel;
      projectile.angle += 18;

      const column = Math.floor(projectile.x / GRID_SIZE) + 1;
      const row = Math.floor(projectile.y / GRID_SIZE) + 1;

      // El proyectil cruza el pasillo y desaparece al entrar en la pared
      // opuesta. Nunca existe una segunda estatua esperándolo al otro lado.
      if (!MAZE_WALKABLE_CELLS.has(`${column}:${row}`)) {
        projectile.destroy();
        continue;
      }

      const touching =
        Phaser.Math.Distance.Between(
          projectile.x,
          projectile.y,
          this.player.x,
          playerFootY
        ) <= 20;

      if (touching) {
        projectile.destroy();
        this.damagePlayer(STATUE_PROJECTILE_DAMAGE);
      }
    }

    this.statueProjectiles = this.statueProjectiles.filter(
      (projectile) => projectile.active
    );
  }

  private spawnStatueProjectile(
    column: number,
    row: number,
    directionX: -1 | 0 | 1,
    directionY: -1 | 0 | 1,
    time: number
  ): void {
    const x =
      (column - 0.5) * GRID_SIZE +
      directionX * (GRID_SIZE * 0.58);
    const y =
      (row - 0.5) * GRID_SIZE +
      directionY * (GRID_SIZE * 0.58);

    const projectile = this.add.image(x, y, 'maze-fireball')
      .setDisplaySize(18, 18)
      .setDepth(135)
      .setData('bornAt', time)
      .setData('directionX', directionX)
      .setData('directionY', directionY);

    this.statueProjectiles.push(projectile);

    this.tweens.add({
      targets: projectile,
      scaleX: projectile.scaleX * 1.08,
      scaleY: projectile.scaleY * 1.08,
      duration: 110,
      yoyo: true,
      repeat: -1
    });
  }

  private createFinalGate(): void {
    const gateX = ((FINAL_GATE_COLUMNS[0] + FINAL_GATE_COLUMNS[3]) / 2 - 0.5) * GRID_SIZE;
    const gateY = (FINAL_GATE_ROW - 0.5) * GRID_SIZE;

    if (this.finalGateOpen) return;

    this.finalGateVisual = this.add.rectangle(
      gateX,
      gateY,
      GRID_SIZE * FINAL_GATE_COLUMNS.length,
      GRID_SIZE,
      0x4a3025,
      0.98
    )
      .setStrokeStyle(3, 0xd8ad67, 0.95)
      .setDepth(125);

    this.finalGateLabel = this.add.text(gateX, gateY, 'ACCESO FINAL\nSELLADO', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffe9b0',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#3b2115',
      strokeThickness: 3
    })
      .setOrigin(0.5)
      .setDepth(126);
  }

  private checkFinalGateUnlock(): void {
    if (this.finalGateOpen) return;

    const mandatoryMilestonesComplete =
      this.blackSunTriggeredEver &&
      this.sacredBrazierLit;

    if (!mandatoryMilestonesComplete) return;

    this.finalGateOpen = true;
    this.ui.updateStatus('El acceso a la cámara central se ha abierto.');
    this.cameras.main.shake(260, 0.004);

    const gate = this.finalGateVisual;
    const label = this.finalGateLabel;

    if (gate) {
      this.tweens.add({
        targets: gate,
        scaleY: 0.05,
        alpha: 0,
        duration: 520,
        ease: 'Sine.easeIn',
        onComplete: () => gate.destroy()
      });
    }

    if (label) {
      this.tweens.add({
        targets: label,
        alpha: 0,
        duration: 260,
        onComplete: () => label.destroy()
      });
    }

    this.finalGateVisual = undefined;
    this.finalGateLabel = undefined;

    this.time.delayedCall(2200, () => {
      if (this.scene.isActive()) this.ui.updateStatus('');
    });
  }

  private createDesertFragment(): void {
    if (getVillageProgress().desertFragmentObtained) return;

    const centerX =
      ((CENTER_ROOM.left + CENTER_ROOM.right) / 2 - 0.5) * GRID_SIZE;
    const centerY =
      ((CENTER_ROOM.top + CENTER_ROOM.bottom) / 2 - 0.5) * GRID_SIZE;

    // El altar ocupa tres bloques visuales, centrado en la cámara del laberinto.
    // El contenedor conserva la interacción y la recogida del fragmento.
    const altar = this.add.image(0, 0, 'maze-solar-altar')
      .setDisplaySize(GRID_SIZE * 3, GRID_SIZE * 3);

    this.fragmentObject = this.add.container(
      centerX,
      centerY,
      [altar]
    ).setDepth(140);

    this.tweens.add({
      targets: this.fragmentObject,
      y: centerY - 3,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private checkDesertFragmentInteraction(): void {
    if (!this.fragmentObject || getVillageProgress().desertFragmentObtained) return;

    const footY = this.player.y + PLAYER_FOOT_OFFSET_Y;
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      footY,
      this.fragmentObject.x,
      this.fragmentObject.y
    );

    if (distance > FRAGMENT_INTERACTION_RADIUS) {
      if (this.fragmentHintShown) {
        this.fragmentHintShown = false;
        this.ui.updateStatus('');
      }
      return;
    }

    if (!this.fragmentHintShown) {
      this.fragmentHintShown = true;
      this.ui.updateStatus('Pulsa ESPACIO para recoger el fragmento de la Joya.');
    }

    if (!Phaser.Input.Keyboard.JustDown(this.cursors.space!)) return;
    if (!obtainDesertFragment()) return;

    this.fragmentHintShown = false;
    const fragment = this.fragmentObject;
    this.fragmentObject = undefined;

    this.activatePostFragmentRoute();

    this.ui.updateStatus(
      'Has recuperado el fragmento. El acceso sur se ha cerrado: busca la nueva salida al norte.'
    );
    this.cameras.main.flash(420, 255, 226, 120, false);

    this.tweens.add({
      targets: fragment,
      scaleX: 1.7,
      scaleY: 1.7,
      alpha: 0,
      duration: 420,
      ease: 'Sine.easeOut',
      onComplete: () => fragment.destroy()
    });

    this.time.delayedCall(3200, () => {
      if (this.scene.isActive()) this.ui.updateStatus('');
    });
  }

  private createPostFragmentRouteVisuals(): void {
    if (!this.postFragmentRouteActive) return;
    this.createClosedSouthGate();
  }

  private activatePostFragmentRoute(): void {
    if (this.postFragmentRouteActive) return;

    this.postFragmentRouteActive = true;
    this.createClosedSouthGate();
    this.createPostFragmentScorpionCracks();

    const northX =
      ((NORTH_GATE_COLUMNS[0] + NORTH_GATE_COLUMNS[3]) / 2 - 0.5) * GRID_SIZE;
    const northY = (NORTH_GATE_ROW - 0.5) * GRID_SIZE;

    this.cameras.main.shake(320, 0.005);
    this.add.rectangle(
      northX,
      northY,
      GRID_SIZE * NORTH_GATE_COLUMNS.length,
      GRID_SIZE,
      0xe8c879,
      0.18
    )
      .setStrokeStyle(2, 0xffe8a8, 0.55)
      .setDepth(118);

    this.time.delayedCall(1100, () => {
      if (this.scene.isActive()) {
        this.ui.updateStatus(
          'Una nueva ruta se ha abierto al norte de la cámara.'
        );
      }
    });

    this.time.delayedCall(3300, () => {
      if (this.scene.isActive()) this.ui.updateStatus('');
    });
  }

  private createClosedSouthGate(): void {
    if (this.postFragmentSouthGate) return;

    const gateX =
      ((FINAL_GATE_COLUMNS[0] + FINAL_GATE_COLUMNS[3]) / 2 - 0.5) * GRID_SIZE;
    const gateY = (FINAL_GATE_ROW - 0.5) * GRID_SIZE;

    this.postFragmentSouthGate = this.add.rectangle(
      gateX,
      gateY,
      GRID_SIZE * FINAL_GATE_COLUMNS.length,
      GRID_SIZE,
      0x3b2a24,
      0.98
    )
      .setStrokeStyle(3, 0x8f755e, 0.95)
      .setDepth(132);
  }

  private createSecondSacredBrazier(): void {
    const x = (SECOND_SACRED_BRAZIER_POSITION.column - 0.5) * GRID_SIZE;
    const y = (SECOND_SACRED_BRAZIER_POSITION.row - 0.5) * GRID_SIZE;

    this.add.image(x, y, 'maze-sacred-brazier')
      .setDisplaySize(GRID_SIZE, GRID_SIZE)
      .setDepth(125);

    this.add.text(x, y - 38, 'BRASERO SAGRADO', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffe4b8',
      fontStyle: 'bold',
      backgroundColor: 'rgba(44, 25, 14, 0.84)',
      padding: { x: 5, y: 3 }
    })
      .setOrigin(0.5, 1)
      .setDepth(128);

  }

  private checkSecondSacredBrazier(): void {
    if (
      !this.postFragmentRouteActive ||
      !this.secondBlackSunTriggered ||
      this.secondSacredBrazierLit ||
      !this.blackSunActivated
    ) {
      return;
    }

    const x = (SECOND_SACRED_BRAZIER_POSITION.column - 0.5) * GRID_SIZE;
    const y = (SECOND_SACRED_BRAZIER_POSITION.row - 0.5) * GRID_SIZE;
    const footY = this.player.y + PLAYER_FOOT_OFFSET_Y;

    if (
      Phaser.Math.Distance.Between(this.player.x, footY, x, y) >
      SACRED_BRAZIER_TRIGGER_RADIUS
    ) {
      return;
    }

    this.secondSacredBrazierLit = true;
    this.blackSunActivated = false;

    this.ui.updateStatus(
      'El segundo Brasero Sagrado ha devuelto la luz al laberinto.'
    );
    this.cameras.main.flash(380, 255, 205, 110, false);

    if (this.darknessOverlay) {
      const overlay = this.darknessOverlay;
      this.tweens.killTweensOf(overlay);
      this.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 1100,
        ease: 'Sine.easeOut',
        onComplete: () => {
          overlay.destroy();
          if (this.darknessOverlay === overlay) {
            this.darknessOverlay = undefined;
          }
        }
      });
    }

    this.time.delayedCall(2600, () => {
      if (this.scene.isActive()) this.ui.updateStatus('');
    });
  }

  private createSecondBlackSun(): void {
    const x = (SECOND_BLACK_SUN_GATE.column - 0.5) * GRID_SIZE;
    const firstY = (SECOND_BLACK_SUN_GATE.rows[0] - 0.5) * GRID_SIZE;
    const secondY = (SECOND_BLACK_SUN_GATE.rows[1] - 0.5) * GRID_SIZE;
    const y = (firstY + secondY) / 2;

    const sun = this.add.image(0, 0, 'maze-black-sun')
      .setDisplaySize(GRID_SIZE, GRID_SIZE);

    this.secondBlackSunObject = this.add.container(x, y, [sun])
      .setDepth(130);

    this.tweens.add({
      targets: sun,
      scaleX: sun.scaleX * 1.03,
      scaleY: sun.scaleY * 1.03,
      alpha: 0.92,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private checkSecondBlackSunActivation(): void {
    if (
      !this.postFragmentRouteActive ||
      this.secondBlackSunTriggered
    ) {
      return;
    }

    const footY = this.player.y + PLAYER_FOOT_OFFSET_Y;
    const column = Math.floor(this.player.x / GRID_SIZE) + 1;
    const row = Math.floor(footY / GRID_SIZE) + 1;

    const crossed =
      column === SECOND_BLACK_SUN_GATE.column &&
      SECOND_BLACK_SUN_GATE.rows.includes(
        row as (typeof SECOND_BLACK_SUN_GATE.rows)[number]
      );

    if (!crossed) return;

    this.secondBlackSunTriggered = true;
    this.blackSunActivated = true;
    this.ui.updateStatus(
      'Otro Sol Negro apaga la luz en el camino de regreso.'
    );
    this.activateBlackSunDarkness();
  }

  private updatePostFragmentThreats(time: number): void {
    if (!this.postFragmentRouteActive) return;

    // Dos nuevas grietas repartidas por el largo recorrido superior. Son
    // posiciones del propio componente antes aislado, no atajos añadidos.
    const cracks = [
      { column: 60, row: 16 },
      { column: 5, row: 53 }
    ] as const;

    const footY = this.player.y + PLAYER_FOOT_OFFSET_Y;

    for (const crack of cracks) {
      const key = `${crack.column}:${crack.row}`;
      if (this.postFragmentScorpionsSpawned.has(key)) continue;

      const x = (crack.column - 0.5) * GRID_SIZE;
      const y = (crack.row - 0.5) * GRID_SIZE;

      if (
        Phaser.Math.Distance.Between(this.player.x, footY, x, y) >
        MAZE_SCORPION_TRIGGER_RADIUS
      ) {
        continue;
      }

      this.postFragmentScorpionsSpawned.add(key);
      this.spawnMazeScorpion(x, y, time);
    }
  }

  private createBlackSun(): void {
    const landmark = MAZE_LANDMARKS.find((item) => item.id === 'blackSun');
    if (!landmark) return;

    const firstColumnCenter =
      (BLACK_SUN_GATE.columns[0] - 0.5) * GRID_SIZE;
    const secondColumnCenter =
      (BLACK_SUN_GATE.columns[1] - 0.5) * GRID_SIZE;
    const x = (firstColumnCenter + secondColumnCenter) / 2;
    const firstRowCenter = (BLACK_SUN_GATE.rows[0] - 0.5) * GRID_SIZE;
    const secondRowCenter = (BLACK_SUN_GATE.rows[1] - 0.5) * GRID_SIZE;
    const y = (firstRowCenter + secondRowCenter) / 2;

    const sun = this.add.image(0, 0, 'maze-black-sun')
      .setDisplaySize(GRID_SIZE, GRID_SIZE);

    this.blackSunObject = this.add.container(x, y, [sun])
      .setDepth(130);

    this.tweens.add({
      targets: sun,
      scaleX: sun.scaleX * 1.03,
      scaleY: sun.scaleY * 1.03,
      alpha: 0.92,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private checkBlackSunActivation(): void {
    if (this.blackSunActivated || this.sacredBrazierLit) return;

    const landmark = MAZE_LANDMARKS.find((item) => item.id === 'blackSun');
    if (!landmark) return;

    const footY = this.player.y + PLAYER_FOOT_OFFSET_Y;
    const column = Math.floor(this.player.x / GRID_SIZE) + 1;
    const row = Math.floor(footY / GRID_SIZE) + 1;

    // El Sol Negro ocupa las dos celdas de ancho del único corredor de paso
    // en este punto. No se puede continuar por esta ruta sin atravesar una de
    // las dos celdas y, por tanto, sin activar la oscuridad.
    const crossedBlackSunGate =
      BLACK_SUN_GATE.columns.includes(
        column as (typeof BLACK_SUN_GATE.columns)[number]
      ) &&
      BLACK_SUN_GATE.rows.includes(
        row as (typeof BLACK_SUN_GATE.rows)[number]
      );

    if (!crossedBlackSunGate) return;

    this.blackSunActivated = true;
    this.blackSunTriggeredEver = true;
    this.activateBlackSunDarkness();
  }

  private activateBlackSunDarkness(): void {
    this.ui.updateStatus('El Sol Negro ha apagado la luz del laberinto.');

    this.cameras.main.shake(260, 0.004);

    // No usamos una máscara invertida: en Phaser 4 su comportamiento difiere
    // entre renderizadores. Dibujamos directamente la oscuridad alrededor de
    // un hueco circular, de modo que el foco sea estable en WebGL y Canvas.
    this.darknessOverlay = this.add.graphics()
      .setDepth(20000)
      .setAlpha(0);

    // El HUD usa una cámara independiente. La oscuridad pertenece solo al
    // mundo y nunca debe tapar energía, monedas ni controles.
    this.ui.ignoreWorldObject(this.darknessOverlay);

    this.updateDarknessMask();

    this.tweens.add({
      targets: this.darknessOverlay,
      alpha: 1,
      duration: 800,
      ease: 'Sine.easeInOut'
    });

    this.time.delayedCall(2400, () => {
      if (this.scene.isActive()) this.ui.updateStatus('');
    });
  }

  private updateDarknessMask(): void {
    if (!this.blackSunActivated || !this.darknessOverlay) return;

    const centerX = this.player.x;
    const centerY = this.player.y + PLAYER_FOOT_OFFSET_Y;
    const graphics = this.darknessOverlay;

    graphics.clear();

    // Exterior completamente oscuro.
    this.drawDarknessOutsideCircle(
      graphics,
      centerX,
      centerY,
      BLACK_SUN_FEATHER_RADIUS,
      BLACK_SUN_DARKNESS_ALPHA
    );

    // Transición más progresiva del foco: mantenemos el radio útil de
    // 180 px, pero repartimos la caída de luz en más bandas hasta 250 px.
    this.drawDarknessRing(graphics, centerX, centerY, 242, 250, 0.88);
    this.drawDarknessRing(graphics, centerX, centerY, 234, 242, 0.78);
    this.drawDarknessRing(graphics, centerX, centerY, 226, 234, 0.68);
    this.drawDarknessRing(graphics, centerX, centerY, 218, 226, 0.57);
    this.drawDarknessRing(graphics, centerX, centerY, 210, 218, 0.46);
    this.drawDarknessRing(graphics, centerX, centerY, 202, 210, 0.35);
    this.drawDarknessRing(graphics, centerX, centerY, 194, 202, 0.25);
    this.drawDarknessRing(graphics, centerX, centerY, 187, 194, 0.16);
    this.drawDarknessRing(
      graphics,
      centerX,
      centerY,
      BLACK_SUN_VISION_RADIUS,
      187,
      0.08
    );
  }

  private drawDarknessOutsideCircle(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
    radius: number,
    alpha: number
  ): void {
    graphics.fillStyle(0x000000, alpha);

    const top = Math.max(0, centerY - radius);
    const bottom = Math.min(WORLD_HEIGHT, centerY + radius);

    if (top > 0) graphics.fillRect(0, 0, WORLD_WIDTH, top);
    if (bottom < WORLD_HEIGHT) {
      graphics.fillRect(0, bottom, WORLD_WIDTH, WORLD_HEIGHT - bottom);
    }

    for (
      let y = Math.max(0, centerY - radius);
      y < Math.min(WORLD_HEIGHT, centerY + radius);
      y += BLACK_SUN_SPOTLIGHT_STEP
    ) {
      const sampleY = y + BLACK_SUN_SPOTLIGHT_STEP / 2;
      const dy = sampleY - centerY;
      const halfWidth = Math.sqrt(Math.max(0, radius * radius - dy * dy));
      const leftEdge = Math.max(0, centerX - halfWidth);
      const rightEdge = Math.min(WORLD_WIDTH, centerX + halfWidth);

      if (leftEdge > 0) {
        graphics.fillRect(0, y, leftEdge, BLACK_SUN_SPOTLIGHT_STEP + 1);
      }
      if (rightEdge < WORLD_WIDTH) {
        graphics.fillRect(
          rightEdge,
          y,
          WORLD_WIDTH - rightEdge,
          BLACK_SUN_SPOTLIGHT_STEP + 1
        );
      }
    }
  }

  private drawDarknessRing(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
    alpha: number
  ): void {
    graphics.fillStyle(0x000000, alpha);

    for (
      let y = centerY - outerRadius;
      y < centerY + outerRadius;
      y += BLACK_SUN_SPOTLIGHT_STEP
    ) {
      if (y < 0 || y >= WORLD_HEIGHT) continue;

      const sampleY = y + BLACK_SUN_SPOTLIGHT_STEP / 2;
      const dy = sampleY - centerY;
      const outerHalf = Math.sqrt(
        Math.max(0, outerRadius * outerRadius - dy * dy)
      );

      const innerHalf =
        Math.abs(dy) < innerRadius
          ? Math.sqrt(Math.max(0, innerRadius * innerRadius - dy * dy))
          : 0;

      const leftOuter = Math.max(0, centerX - outerHalf);
      const rightOuter = Math.min(WORLD_WIDTH, centerX + outerHalf);
      const leftInner = Math.max(0, centerX - innerHalf);
      const rightInner = Math.min(WORLD_WIDTH, centerX + innerHalf);

      if (innerHalf > 0) {
        if (leftInner > leftOuter) {
          graphics.fillRect(
            leftOuter,
            y,
            leftInner - leftOuter,
            BLACK_SUN_SPOTLIGHT_STEP + 1
          );
        }
        if (rightOuter > rightInner) {
          graphics.fillRect(
            rightInner,
            y,
            rightOuter - rightInner,
            BLACK_SUN_SPOTLIGHT_STEP + 1
          );
        }
      } else if (rightOuter > leftOuter) {
        graphics.fillRect(
          leftOuter,
          y,
          rightOuter - leftOuter,
          BLACK_SUN_SPOTLIGHT_STEP + 1
        );
      }
    }
  }

  private createCenterChamberMarker(): void {
    const centerX = ((CENTER_ROOM.left + CENTER_ROOM.right) / 2 - 0.5) * GRID_SIZE;
    const centerY = ((CENTER_ROOM.top + CENTER_ROOM.bottom) / 2 - 0.5) * GRID_SIZE;

    this.add.circle(centerX, centerY, 52, 0xd9b94e, 0.22)
      .setStrokeStyle(4, 0xffe89a, 0.8)
      .setDepth(20);

    this.add.text(centerX, centerY - 2, 'FRAGMENTO\nCENTRAL', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#fff1b4',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#4a2b18',
      strokeThickness: 4
    })
      .setOrigin(0.5)
      .setDepth(21);
  }

  private createGridGuide(): void {
    if (this.textures.exists(GRID_TEXTURE_KEY)) {
      this.textures.remove(GRID_TEXTURE_KEY);
    }

    const texture = this.textures.createCanvas(
      GRID_TEXTURE_KEY,
      WORLD_WIDTH,
      WORLD_HEIGHT
    );
    if (!texture) return;

    const context = texture.context;
    context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    context.textBaseline = 'top';
    context.font = '6px Arial';

    for (let column = 0; column <= WORLD_COLUMNS; column += 1) {
      const x = column * GRID_SIZE + 0.5;
      context.beginPath();
      context.strokeStyle = column % 5 === 0
        ? 'rgba(255,236,170,0.48)'
        : 'rgba(255,255,255,0.15)';
      context.lineWidth = column % 5 === 0 ? 1.5 : 1;
      context.moveTo(x, 0);
      context.lineTo(x, WORLD_HEIGHT);
      context.stroke();
    }

    for (let row = 0; row <= WORLD_ROWS; row += 1) {
      const y = row * GRID_SIZE + 0.5;
      context.beginPath();
      context.strokeStyle = row % 5 === 0
        ? 'rgba(255,236,170,0.48)'
        : 'rgba(255,255,255,0.15)';
      context.lineWidth = row % 5 === 0 ? 1.5 : 1;
      context.moveTo(0, y);
      context.lineTo(WORLD_WIDTH, y);
      context.stroke();
    }

    // Etiquetamos solo celdas transitables: son las que vamos a usar para
    // definir trampas, objetos y mecanismos en las siguientes fases.
    for (const key of MAZE_WALKABLE_CELLS) {
      const [columnText, rowText] = key.split(':');
      const column = Number(columnText);
      const row = Number(rowText);

      const x = (column - 1) * GRID_SIZE + 2;
      const y = (row - 1) * GRID_SIZE + 2;
      const label =
        `C${String(column).padStart(2, '0')}/F${String(row).padStart(2, '0')}`;

      context.lineWidth = 2;
      context.strokeStyle = 'rgba(40,20,10,0.70)';
      context.strokeText(label, x, y);
      context.fillStyle = 'rgba(255,241,190,0.80)';
      context.fillText(label, x, y);
    }

    texture.refresh();

    this.add.image(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      GRID_TEXTURE_KEY
    )
      .setDepth(10000)
      .setAlpha(0.9);
  }

  private checkExit(): void {
    const footY = this.player.y + PLAYER_FOOT_OFFSET_Y;
    const column = Math.floor(this.player.x / GRID_SIZE) + 1;

    if (footY < WORLD_HEIGHT - 4 || column < 39 || column > 42) {
      this.exitLockedHintShown = false;
      return;
    }

    if (!getVillageProgress().desertFragmentObtained) {
      if (!this.exitLockedHintShown) {
        this.exitLockedHintShown = true;
        this.ui.updateStatus('La salida permanece sellada hasta recuperar el fragmento de la Joya.');
        this.time.delayedCall(2200, () => {
          if (this.scene.isActive()) this.ui.updateStatus('');
        });
      }
      return;
    }

    this.exitToDesert();
  }

  private exitToDesert(): void {
    if (this.exiting) return;
    this.exiting = true;

    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
    this.cameras.main.fadeOut(240, 12, 7, 3);

    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        // El fragmento del Desierto completa este mundo. La salida del
        // laberinto ya no devuelve al Desierto: continúa hacia El Mar Esmeralda.
        if (this.scene.isSleeping('DesertScene')) {
          this.scene.stop('DesertScene');
        }

        this.scene.start('EmeraldSeaScene', {
          characterId: this.characterId
        });
      }
    );
  }
}

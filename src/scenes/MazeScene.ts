import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';
import {
  createPlayableUi,
  preloadPlayableUiAssets,
  type PlayableUiController
} from '../playableSceneUi';
import { getVillageProgress } from '../villageProgress';

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
const BLACK_SUN_VISION_RADIUS = 190;
const BLACK_SUN_DARKNESS_ALPHA = 0.94;
const BLACK_SUN_TRIGGER_RADIUS = 30;

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

  // Acceso final reservado en el lado sur. Dejamos una antesala transitable,
  // pero el anillo F47 permanece bloqueado. Más adelante ese cierre será el
  // último mecanismo que dará acceso al fragmento.
  for (let row = 48; row <= 52; row += 1) {
    for (let column = 39; column <= 42; column += 1) {
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
    { id: 'blackSun', label: 'SOL NEGRO', color: 0x33233f, ratio: 0.16 },
    { id: 'falseBranch', label: 'FALSA BIFURCACIÓN', color: 0x9a6f32, ratio: 0.31 },
    { id: 'carpetPit', label: 'AGUJERO / ALFOMBRA', color: 0x51362b, ratio: 0.47 },
    { id: 'movingWalls', label: 'MUROS MÓVILES', color: 0x6e6b63, ratio: 0.63 },
    { id: 'sacredBrazier', label: 'BRASERO SAGRADO', color: 0xe2752f, ratio: 0.79 },
    { id: 'statueCorridor', label: 'ESTATUAS LANZADORAS', color: 0x7b5543, ratio: 0.94 }
  ];

  const selected = new Set<string>();

  return definitions.map((definition) => {
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
  private darknessOverlay?: Phaser.GameObjects.Rectangle;
  private darknessMaskGraphics?: Phaser.GameObjects.Graphics;

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
    this.darknessMaskGraphics = undefined;
  }

  preload(): void {
    preloadPlayableUiAssets(this);

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
    this.createLandmarkMarkers();
    this.createPlayer();
    this.createBlackSun();
    this.createPlayerAnimations();
    this.createGridGuide();

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.fadeIn(300, 8, 5, 2);

    const progress = getVillageProgress();
    const character =
      characters.find((item) => item.id === this.characterId) ?? characters[0];

    this.ui = createPlayableUi(
      this,
      this.characterId,
      character.name,
      progress.energy,
      progress.coins,
      { carpetOwned: progress.desertCarpetPurchased }
    );
  }

  update(_time: number, delta: number): void {
    if (this.exiting) return;

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
    return MAZE_WALKABLE_CELLS.has(`${column}:${row}`);
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
    const floor = this.add.graphics().setDepth(0);
    floor.fillStyle(0xb88955, 1);
    floor.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const walls = this.add.graphics().setDepth(50);

    for (let row = 1; row <= WORLD_ROWS; row += 1) {
      for (let column = 1; column <= WORLD_COLUMNS; column += 1) {
        const key = `${column}:${row}`;
        const x = (column - 1) * GRID_SIZE;
        const y = (row - 1) * GRID_SIZE;

        if (MAZE_WALKABLE_CELLS.has(key)) {
          floor.fillStyle(
            column >= CENTER_ROOM.left &&
            column <= CENTER_ROOM.right &&
            row >= CENTER_ROOM.top &&
            row <= CENTER_ROOM.bottom
              ? 0xc9a260
              : 0xb88955,
            1
          );
          floor.fillRect(x, y, GRID_SIZE, GRID_SIZE);
          continue;
        }

        // Pared provisional: sombra frontal + piedra superior. Más adelante
        // se sustituirá por módulos artísticos semicenitales.
        walls.fillStyle(0x3d281d, 0.85);
        walls.fillRect(x + 2, y + 8, GRID_SIZE - 2, GRID_SIZE - 6);
        walls.fillStyle(0x72513a, 1);
        walls.fillRect(x, y, GRID_SIZE - 2, GRID_SIZE - 8);
        walls.lineStyle(1, 0x9b7554, 0.65);
        walls.strokeRect(x, y, GRID_SIZE - 2, GRID_SIZE - 8);
      }
    }
  }


  private createLandmarkMarkers(): void {
    for (const landmark of MAZE_LANDMARKS) {
      if (landmark.id === 'blackSun') continue;

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

    const gateX = ((39 + 42) / 2 - 0.5) * GRID_SIZE;
    const gateY = (47 - 0.5) * GRID_SIZE;

    this.add.rectangle(
      gateX,
      gateY,
      GRID_SIZE * 4,
      GRID_SIZE,
      0x4a3025,
      0.95
    )
      .setStrokeStyle(3, 0xd8ad67, 0.9)
      .setDepth(125);

    this.add.text(gateX, gateY, 'ACCESO FINAL\nSELLADO', {
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

  private createBlackSun(): void {
    const landmark = MAZE_LANDMARKS.find((item) => item.id === 'blackSun');
    if (!landmark) return;

    const x = (landmark.column - 0.5) * GRID_SIZE;
    const y = (landmark.row - 0.5) * GRID_SIZE;

    const aura = this.add.circle(0, 0, 24, 0x5c365f, 0.22)
      .setStrokeStyle(2, 0xa76aa8, 0.65);
    const outer = this.add.circle(0, 0, 17, 0x17101a, 1)
      .setStrokeStyle(3, 0x6f4a73, 1);
    const core = this.add.circle(0, 0, 9, 0x020104, 1)
      .setStrokeStyle(2, 0xb58bb5, 0.8);

    const rays = this.add.graphics();
    rays.lineStyle(2, 0x8f628f, 0.85);
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      rays.beginPath();
      rays.moveTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
      rays.lineTo(Math.cos(angle) * 27, Math.sin(angle) * 27);
      rays.strokePath();
    }

    const label = this.add.text(0, -34, 'SOL NEGRO', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#e8cbea',
      fontStyle: 'bold',
      align: 'center',
      backgroundColor: 'rgba(20, 12, 22, 0.86)',
      padding: { x: 5, y: 3 }
    }).setOrigin(0.5, 1);

    this.blackSunObject = this.add.container(x, y, [aura, rays, outer, core, label])
      .setDepth(130);

    this.tweens.add({
      targets: [aura, outer],
      scaleX: 1.12,
      scaleY: 1.12,
      alpha: 0.5,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private checkBlackSunActivation(): void {
    if (this.blackSunActivated) return;

    const landmark = MAZE_LANDMARKS.find((item) => item.id === 'blackSun');
    if (!landmark) return;

    const x = (landmark.column - 0.5) * GRID_SIZE;
    const y = (landmark.row - 0.5) * GRID_SIZE;
    const footY = this.player.y + PLAYER_FOOT_OFFSET_Y;

    if (
      Phaser.Math.Distance.Between(this.player.x, footY, x, y) >
      BLACK_SUN_TRIGGER_RADIUS
    ) {
      return;
    }

    this.blackSunActivated = true;
    this.activateBlackSunDarkness();
  }

  private activateBlackSunDarkness(): void {
    this.ui.updateStatus('El Sol Negro ha apagado la luz del laberinto.');

    this.cameras.main.shake(260, 0.004);

    this.darknessOverlay = this.add.rectangle(
      0,
      0,
      WORLD_WIDTH,
      WORLD_HEIGHT,
      0x000000,
      BLACK_SUN_DARKNESS_ALPHA
    )
      .setOrigin(0)
      .setDepth(9000)
      .setAlpha(0);

    this.darknessMaskGraphics = this.make.graphics({ x: 0, y: 0 });
    const mask = this.darknessMaskGraphics.createGeometryMask();
    mask.setInvertAlpha(true);
    this.darknessOverlay.setMask(mask);

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
    if (
      !this.blackSunActivated ||
      !this.darknessOverlay ||
      !this.darknessMaskGraphics
    ) {
      return;
    }

    this.darknessMaskGraphics.clear();
    this.darknessMaskGraphics.fillStyle(0xffffff, 1);
    this.darknessMaskGraphics.fillCircle(
      this.player.x,
      this.player.y + PLAYER_FOOT_OFFSET_Y,
      BLACK_SUN_VISION_RADIUS
    );
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
        if (this.scene.isSleeping('DesertScene')) {
          const desert = this.scene.get('DesertScene') as unknown as {
            returnFromMaze?: () => void;
            cameras: Phaser.Cameras.Scene2D.CameraManager;
          };

          desert.returnFromMaze?.();
          this.scene.wake('DesertScene');
          desert.cameras.main.fadeIn(240, 8, 5, 2);
          this.scene.stop();
          return;
        }

        this.scene.start('DesertScene', { characterId: this.characterId });
      }
    );
  }
}

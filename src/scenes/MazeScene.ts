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
const FLOOR_TEXTURE_KEY = 'maze-floor-guide';
const WALL_TEXTURE_KEY = 'maze-wall-guide';

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

  // Cámara central provisional. Es deliberadamente grande para que se
  // perciba como destino desde corredores cercanos.
  for (let row = CENTER_ROOM.top; row <= CENTER_ROOM.bottom; row += 1) {
    for (let column = CENTER_ROOM.left; column <= CENTER_ROOM.right; column += 1) {
      walkable.add(`${column}:${row}`);
    }
  }

  // Abrimos cuatro accesos provisionales a la cámara. En fases posteriores
  // algunos se cerrarán mediante mecanismos y muros móviles.
  for (let column = 39; column <= 42; column += 1) {
    for (let row = 31; row <= CENTER_ROOM.top; row += 1) {
      walkable.add(`${column}:${row}`);
    }
    for (let row = CENTER_ROOM.bottom; row <= 50; row += 1) {
      walkable.add(`${column}:${row}`);
    }
  }
  for (let row = 39; row <= 42; row += 1) {
    for (let column = 31; column <= CENTER_ROOM.left; column += 1) {
      walkable.add(`${column}:${row}`);
    }
    for (let column = CENTER_ROOM.right; column <= 50; column += 1) {
      walkable.add(`${column}:${row}`);
    }
  }

  return walkable;
}

const MAZE_WALKABLE_CELLS = buildMazeWalkableCells();

export class MazeScene extends Phaser.Scene {
  private characterId: CharacterId = 'tiana';
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private ui!: PlayableUiController;
  private facing: Facing = 'up';
  private exiting = false;
  private exitLockedHintShown = false;

  constructor() {
    super('MazeScene');
  }

  init(data: MazeSceneData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.facing = 'up';
    this.exiting = false;
    this.exitLockedHintShown = false;
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
    this.createPlayer();
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

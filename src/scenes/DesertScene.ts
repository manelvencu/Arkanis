import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';
import {
  createPlayableUi,
  preloadPlayableUiAssets,
  type PlayableUiController
} from '../playableSceneUi';
import { getVillageProgress, setVillageEnergy } from '../villageProgress';
import { isDesertWalkableFootPoint } from '../desertWalkableGrid';

interface DesertSceneData {
  characterId?: CharacterId;
}

type Facing = 'down' | 'up' | 'side';

const GRID_SIZE = 32;
const WORLD_COLUMNS = 90;
const WORLD_ROWS = 22;
const WORLD_WIDTH = WORLD_COLUMNS * GRID_SIZE;
const WORLD_HEIGHT = WORLD_ROWS * GRID_SIZE;
const GRID_TEXTURE_KEY = 'desert-grid-guide';
const DESERT_BACKGROUND_KEY = 'desert-world-01';

const DESERT_BUILDINGS = [
  {
    key: 'desert-building-house-awning-01',
    path: './assets/world/desert/buildings/Mercado de adobe del desierto.png',
    column: 13,
    row: 11,
    width: 160,
    height: 144
  },
  {
    key: 'desert-building-house-terrace-01',
    path: './assets/world/desert/buildings/Casa de adobe del desierto con terrazas.png',
    column: 20,
    row: 12,
    width: 160,
    height: 144
  },
  {
    key: 'desert-building-dome-01',
    path: './assets/world/desert/buildings/Casa desértica isométrica con cúpula y toldos.png',
    column: 27,
    row: 12,
    width: 144,
    height: 176
  },
  {
    key: 'desert-building-market-tent-01',
    path: './assets/world/desert/buildings/Mercado desértico bajo una carpa roja.png',
    column: 19,
    row: 18,
    width: 144,
    height: 128
  },
  {
    key: 'desert-building-market-tent-01',
    path: './assets/world/desert/buildings/Mercado desértico bajo una carpa roja.png',
    column: 12,
    row: 14,
    width: 144,
    height: 128
  },
  {
    key: 'desert-building-market-tent-01',
    path: './assets/world/desert/buildings/Mercado desértico bajo una carpa roja.png',
    column: 22,
    row: 16,
    width: 144,
    height: 128
  }
] as const;

const DESERT_PALMS = [
  {
    key: 'desert-palm-tall-01',
    path: './assets/world/desert/vegetation/Palmera desértica en estilo píxel.png',
    column: 10,
    row: 7,
    width: 92,
    height: 192
  },
  {
    key: 'desert-palm-medium-01',
    path: './assets/world/desert/vegetation/Palmera tropical en terreno arenoso.png',
    column: 11,
    row: 10,
    width: 82,
    height: 160
  },
  {
    key: 'desert-palm-tall-01',
    path: './assets/world/desert/vegetation/Palmera desértica en estilo píxel.png',
    column: 11,
    row: 12,
    width: 92,
    height: 192
  },
  {
    key: 'desert-palm-medium-01',
    path: './assets/world/desert/vegetation/Palmera tropical en terreno arenoso.png',
    column: 27,
    row: 5,
    width: 82,
    height: 160
  },
  {
    key: 'desert-palm-tall-01',
    path: './assets/world/desert/vegetation/Palmera desértica en estilo píxel.png',
    column: 26,
    row: 7,
    width: 92,
    height: 192
  },
  {
    key: 'desert-palm-medium-01',
    path: './assets/world/desert/vegetation/Palmera tropical en terreno arenoso.png',
    column: 30,
    row: 11,
    width: 82,
    height: 160
  },
  {
    key: 'desert-palm-tall-01',
    path: './assets/world/desert/vegetation/Palmera desértica en estilo píxel.png',
    column: 20,
    row: 16,
    width: 92,
    height: 192
  }
] as const;

const PLAYER_SIZE = 64;
const PLAYER_SPEED = 180;
const PLAYER_FOOT_OFFSET_Y = 20;
const PLAYER_START_CELL = { column: 5, row: 12 } as const;
const PLAYER_START = {
  x: (PLAYER_START_CELL.column - 0.5) * GRID_SIZE,
  // Colocamos el centro entre los pies exactamente en C5/F12.
  y: (PLAYER_START_CELL.row - 0.5) * GRID_SIZE - PLAYER_FOOT_OFFSET_Y
} as const;

const MAGIC_RAY_SPEED = 430;
const MAGIC_RAY_SPAWN_OFFSET = 36;
const MAGIC_RAY_LIFETIME = 900;

const DESERT_SNAKE_PATROLS = [
  {
    points: [
      { column: 26, row: 10 },
      { column: 14, row: 10 }
    ]
  },
  {
    points: [
      { column: 57, row: 12 },
      { column: 39, row: 12 }
    ]
  },
  {
    points: [
      { column: 68, row: 14 },
      { column: 56, row: 14 }
    ]
  },
  {
    points: [
      { column: 77, row: 13 },
      { column: 72, row: 13 }
    ]
  },
  {
    points: [
      { column: 82, row: 15 },
      { column: 82, row: 14 },
      { column: 76, row: 14 },
      { column: 76, row: 15 }
    ]
  }
] as const;

const DESERT_ROCKS = [
  { column: 57, row: 12 },
  { column: 39, row: 12 },
  { column: 68, row: 14 },
  { column: 56, row: 14 },
  { column: 77, row: 13 },
  { column: 72, row: 13 },
  { column: 82, row: 15 },
  { column: 76, row: 15 }
] as const;

const DESERT_SCORPION_PATROLS = [
  {
    points: [
      { column: 76, row: 15 },
      { column: 76, row: 13 }
    ]
  },
  {
    points: [
      { column: 68, row: 14 },
      { column: 68, row: 11 }
    ]
  },
  {
    points: [
      { column: 56, row: 14 },
      { column: 57, row: 12 }
    ]
  },
  {
    points: [
      { column: 39, row: 12 },
      { column: 39, row: 14 }
    ]
  },
  {
    points: [
      { column: 16, row: 14 }
    ]
  },
  {
    points: [
      { column: 16, row: 17 }
    ]
  }
] as const;

const SNAKE_SPEED = 72;
const SNAKE_WIDTH = 38;
const SNAKE_HEIGHT = 19;
const SNAKE_DAMAGE = 20;

const SCORPION_SPEED = 58;
const SCORPION_SIZE = 20;
const SCORPION_DAMAGE = 20;

const REGISTRY_ENERGY_KEY = 'arkanis.player.energy';
const REGISTRY_COINS_KEY = 'arkanis.player.coins';

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

/**
 * El Desierto de Mil Soles.
 *
 * Mundo horizontal grande:
 * - 90 columnas
 * - 22 filas
 * - celdas de 32×32 px
 * - 2880×704 px lógicos
 *
 * El fondo visual se dibuja como una única composición inmóvil.
 * Personaje, NPC, enemigos, construcciones adicionales y objetos
 * interactivos se montan encima.
 */
export class DesertScene extends Phaser.Scene {
  private characterId: CharacterId = 'tiana';
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private ui!: PlayableUiController;
  private facing: Facing = 'side';
  private direction = new Phaser.Math.Vector2(1, 0);
  private lastShotAt = 0;
  private snakes: Phaser.Physics.Arcade.Sprite[] = [];
  private scorpions: Phaser.Physics.Arcade.Sprite[] = [];
  private magicRays: Phaser.Physics.Arcade.Image[] = [];
  private isGameOver = false;

  constructor() {
    super('DesertScene');
  }

  init(data: DesertSceneData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.facing = 'side';
    this.direction.set(1, 0);
    this.lastShotAt = 0;
    this.snakes = [];
    this.scorpions = [];
    this.magicRays = [];
    this.isGameOver = false;
  }

  preload(): void {
    this.load.image(
      DESERT_BACKGROUND_KEY,
      './assets/world/desert/desert-world-01.png'
    );

    const loadedBuildingKeys = new Set<string>();
    DESERT_BUILDINGS.forEach((building) => {
      if (loadedBuildingKeys.has(building.key)) return;
      loadedBuildingKeys.add(building.key);
      this.load.image(building.key, building.path);
    });

    const loadedPalmKeys = new Set<string>();
    DESERT_PALMS.forEach((palm) => {
      if (loadedPalmKeys.has(palm.key)) return;
      loadedPalmKeys.add(palm.key);
      this.load.image(palm.key, palm.path);
    });

    this.load.image(
      'desert-snake-01',
      './assets/world/desert/enemies/snakes/serpiente-01.png'
    );
    this.load.image(
      'desert-snake-02',
      './assets/world/desert/enemies/snakes/serpiente-02.png'
    );
    this.load.image(
      'desert-rock-01',
      './assets/world/desert/props/Montón de rocas desérticas estilizadas.png'
    );
    this.load.image(
      'desert-scorpion-down-01',
      './assets/world/desert/enemies/scorpions/escorpion_down_01.png'
    );
    this.load.image(
      'desert-scorpion-up-01',
      './assets/world/desert/enemies/scorpions/escorpion_up_01.png'
    );

    preloadPlayableUiAssets(this);

    const characterKey = this.characterId === 'lupe' ? 'lupe' : 'tiana';
    Object.entries(CHARACTER_ASSETS[characterKey]).forEach(([key, path]) => {
      this.load.image(`desert-player-${key}`, path);
    });
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#b98245');

    this.createWorldBackground();
    this.createBuildings();
    this.createPalms();
    this.createGridGuide();
    this.createPlayer();
    this.createRocks();
    this.createSnakes();
    this.createScorpions();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(700, 8, 5, 2);

    // VillageProgress contiene el estado más reciente después de ZE y La Aldea.
    // No restauramos desde Registry aquí porque las monedas pueden haber cambiado
    // dentro de las cabañas de La Aldea después de la primera sincronización.
    const progress = getVillageProgress();
    const character = characters.find((item) => item.id === this.characterId) ?? characters[0];

    this.ui = createPlayableUi(
      this,
      this.characterId,
      character.name,
      progress.energy,
      progress.coins
    );

    // Registry sigue reflejando el estado actual para futuras transiciones.
    this.registry.set(REGISTRY_ENERGY_KEY, progress.energy);
    this.registry.set(REGISTRY_COINS_KEY, progress.coins);
  }

  update(time: number, delta: number): void {
    if (this.isGameOver) return;

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
      const distance = PLAYER_SPEED * (delta / 1000);
      this.movePlayerWithinWalkableGrid(
        movement.x * distance,
        movement.y * distance
      );
      this.direction.copy(movement);

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

      this.player.anims.play(`desert-walk-${this.facing}`, true);
    } else {
      this.player.anims.stop();
      const idleKey = this.facing === 'side' ? 'side' : this.facing;
      this.player.setTexture(`desert-player-${idleKey}`);
    }

    this.applyTempleStairsScale();
    this.updateWorldDepths();
    this.updateSnakes();
    this.updateScorpions(time);

    const keyboardShot = Phaser.Input.Keyboard.JustDown(this.spaceKey);
    const touchShot = this.ui.consumeShootRequest();

    if ((keyboardShot || touchShot) && time - this.lastShotAt > 250) {
      this.shootMagicRay();
      this.lastShotAt = time;
    }
  }

  private createWorldBackground(): void {
    this.add.image(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      DESERT_BACKGROUND_KEY
    )
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(0);
  }

  private createBuildings(): void {
    DESERT_BUILDINGS.forEach((building) => {
      const x = (building.column - 0.5) * GRID_SIZE;
      const baseY = building.row * GRID_SIZE;

      this.add.image(x, baseY, building.key)
        .setOrigin(0.5, 1)
        .setDisplaySize(building.width, building.height)
        .setDepth(baseY);
    });
  }

  private createPalms(): void {
    DESERT_PALMS.forEach((palm) => {
      const x = (palm.column - 0.5) * GRID_SIZE;
      const baseY = palm.row * GRID_SIZE;

      this.add.image(x, baseY, palm.key)
        .setOrigin(0.5, 1)
        .setDisplaySize(palm.width, palm.height)
        .setDepth(baseY);
    });
  }

  private movePlayerWithinWalkableGrid(dx: number, dy: number): void {
    const maxStep = 4;
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / maxStep)
    );
    const stepX = dx / steps;
    const stepY = dy / steps;

    for (let index = 0; index < steps; index += 1) {
      const nextX = this.player.x + stepX;
      if (isDesertWalkableFootPoint(nextX, this.player.y)) {
        this.player.x = nextX;
      }

      const nextY = this.player.y + stepY;
      if (isDesertWalkableFootPoint(this.player.x, nextY)) {
        this.player.y = nextY;
      }
    }
  }

  private applyTempleStairsScale(): void {
    const footX = this.player.x;
    const footY = this.player.y + PLAYER_FOOT_OFFSET_Y;
    const column = Math.floor(footX / GRID_SIZE) + 1;
    const row = Math.floor(footY / GRID_SIZE) + 1;

    let scale = 1;

    if (column === 18 || column === 19) {
      if (row === 7) scale = 0.8;
      else if (row === 6) scale = 0.6;
      else if (row === 5) scale = 0.4;
    }

    this.player.setDisplaySize(PLAYER_SIZE * scale, PLAYER_SIZE * scale);
  }

  private updateWorldDepths(): void {
    const footY = this.player.y + PLAYER_FOOT_OFFSET_Y;
    this.player.setDepth(footY);
  }

  private createRocks(): void {
    DESERT_ROCKS.forEach((rock) => {
      const x = (rock.column - 0.5) * GRID_SIZE;
      const baseY = rock.row * GRID_SIZE;

      this.add.image(x, baseY, 'desert-rock-01')
        .setOrigin(0.5, 1)
        .setDisplaySize(48, 32)
        .setDepth(baseY);
    });
  }

  private createSnakes(): void {
    if (!this.anims.exists('desert-snake-slither')) {
      this.anims.create({
        key: 'desert-snake-slither',
        frames: [
          { key: 'desert-snake-01' },
          { key: 'desert-snake-02' }
        ],
        frameRate: 5,
        repeat: -1
      });
    }

    this.snakes = DESERT_SNAKE_PATROLS.map((patrol) => {
      const firstPoint = patrol.points[0];
      const startX = (firstPoint.column - 0.5) * GRID_SIZE;
      const startY = (firstPoint.row - 0.5) * GRID_SIZE;
      const points = patrol.points.map((point) => ({
        x: (point.column - 0.5) * GRID_SIZE,
        y: (point.row - 0.5) * GRID_SIZE
      }));

      const snake = this.physics.add.sprite(startX, startY, 'desert-snake-01');

      snake
        .setDisplaySize(SNAKE_WIDTH, SNAKE_HEIGHT)
        .setDepth(startY)
        .setData('patrolPoints', points)
        .setData('patrolIndex', 1)
        .setData('patrolDirection', 1)
        .setData('touchingPlayerCell', false);

      const body = snake.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setSize(SNAKE_WIDTH * 0.8, SNAKE_HEIGHT * 0.7, true);

      snake.play('desert-snake-slither');
      this.setSnakeVelocityToTarget(snake);

      return snake;
    });
  }

  private setSnakeVelocityToTarget(snake: Phaser.Physics.Arcade.Sprite): void {
    const points = snake.getData('patrolPoints') as Array<{ x: number; y: number }>;
    const index = snake.getData('patrolIndex') as number;
    const target = points[index];
    const body = snake.body as Phaser.Physics.Arcade.Body;

    const direction = new Phaser.Math.Vector2(target.x - snake.x, target.y - snake.y);
    if (direction.lengthSq() === 0) {
      body.setVelocity(0, 0);
      return;
    }

    direction.normalize();
    body.setVelocity(direction.x * SNAKE_SPEED, direction.y * SNAKE_SPEED);

    if (Math.abs(direction.x) > 0.1) {
      snake.setFlipX(direction.x > 0);
    }
  }

  private updateSnakes(): void {
    const playerFootX = this.player.x;
    const playerFootY = this.player.y + PLAYER_FOOT_OFFSET_Y;
    const playerColumn = Math.floor(playerFootX / GRID_SIZE) + 1;
    const playerRow = Math.floor(playerFootY / GRID_SIZE) + 1;

    for (const snake of this.snakes) {
      if (!snake.active) continue;

      const points = snake.getData('patrolPoints') as Array<{ x: number; y: number }>;
      let index = snake.getData('patrolIndex') as number;
      let patrolDirection = snake.getData('patrolDirection') as number;
      const target = points[index];

      snake.setDepth(snake.y);

      const distanceToTarget = Phaser.Math.Distance.Between(snake.x, snake.y, target.x, target.y);
      if (distanceToTarget <= 3) {
        snake.setPosition(target.x, target.y);

        if (index === points.length - 1 && patrolDirection === 1) {
          patrolDirection = -1;
        } else if (index === 0 && patrolDirection === -1) {
          patrolDirection = 1;
        }

        index += patrolDirection;
        snake.setData('patrolIndex', index);
        snake.setData('patrolDirection', patrolDirection);
        this.setSnakeVelocityToTarget(snake);
      }

      const snakeGroundX = snake.x;
      const snakeGroundY = snake.y + SNAKE_HEIGHT / 2;
      const snakeColumn = Math.floor(snakeGroundX / GRID_SIZE) + 1;
      const snakeRow = Math.floor(snakeGroundY / GRID_SIZE) + 1;
      const sameCell = snakeColumn === playerColumn && snakeRow === playerRow;
      const wasTouching = snake.getData('touchingPlayerCell') === true;

      if (sameCell && !wasTouching) {
        this.damagePlayer(SNAKE_DAMAGE);
      }
      snake.setData('touchingPlayerCell', sameCell);

      for (const ray of this.magicRays) {
        if (!ray.active) continue;

        const rayColumn = Math.floor(ray.x / GRID_SIZE) + 1;
        const rayRow = Math.floor(ray.y / GRID_SIZE) + 1;

        if (rayColumn === snakeColumn && rayRow === snakeRow) {
          ray.destroy();
          snake.destroy();
          break;
        }
      }
    }

    this.snakes = this.snakes.filter((snake) => snake.active);
    this.magicRays = this.magicRays.filter((ray) => ray.active);
  }

  private createScorpions(): void {
    this.scorpions = DESERT_SCORPION_PATROLS.map((patrol) => {
      const firstPoint = patrol.points[0];
      const startX = (firstPoint.column - 0.5) * GRID_SIZE;
      const startY = (firstPoint.row - 0.5) * GRID_SIZE;
      const points = patrol.points.map((point) => ({
        x: (point.column - 0.5) * GRID_SIZE,
        y: (point.row - 0.5) * GRID_SIZE
      }));

      const moving = points.length > 1;
      const initialTexture = moving && points[1].y < points[0].y
        ? 'desert-scorpion-up-01'
        : 'desert-scorpion-down-01';

      const scorpion = this.physics.add.sprite(startX, startY, initialTexture);

      scorpion
        .setDisplaySize(SCORPION_SIZE, SCORPION_SIZE)
        .setDepth(startY)
        .setData('patrolPoints', points)
        .setData('patrolIndex', moving ? 1 : 0)
        .setData('patrolDirection', 1)
        .setData('moving', moving)
        .setData('touchingPlayerCell', false)
        .setData('nextMirrorAt', 0);

      const body = scorpion.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setSize(SCORPION_SIZE * 0.75, SCORPION_SIZE * 0.75, true);

      if (moving) this.setScorpionVelocityToTarget(scorpion);
      else body.setVelocity(0, 0);

      return scorpion;
    });
  }

  private setScorpionVelocityToTarget(scorpion: Phaser.Physics.Arcade.Sprite): void {
    const points = scorpion.getData('patrolPoints') as Array<{ x: number; y: number }>;
    const index = scorpion.getData('patrolIndex') as number;
    const target = points[index];
    const body = scorpion.body as Phaser.Physics.Arcade.Body;

    const direction = new Phaser.Math.Vector2(target.x - scorpion.x, target.y - scorpion.y);
    if (direction.lengthSq() === 0) {
      body.setVelocity(0, 0);
      return;
    }

    direction.normalize();
    body.setVelocity(direction.x * SCORPION_SPEED, direction.y * SCORPION_SPEED);

    if (direction.y < -0.1) {
      scorpion.setTexture('desert-scorpion-up-01');
    } else if (direction.y > 0.1) {
      scorpion.setTexture('desert-scorpion-down-01');
    } else {
      scorpion.setTexture(direction.x < 0 ? 'desert-scorpion-up-01' : 'desert-scorpion-down-01');
    }
  }

  private updateScorpions(time: number): void {
    const playerFootX = this.player.x;
    const playerFootY = this.player.y + PLAYER_FOOT_OFFSET_Y;
    const playerColumn = Math.floor(playerFootX / GRID_SIZE) + 1;
    const playerRow = Math.floor(playerFootY / GRID_SIZE) + 1;

    for (const scorpion of this.scorpions) {
      if (!scorpion.active) continue;

      const moving = scorpion.getData('moving') === true;
      const points = scorpion.getData('patrolPoints') as Array<{ x: number; y: number }>;

      if (moving) {
        let index = scorpion.getData('patrolIndex') as number;
        let patrolDirection = scorpion.getData('patrolDirection') as number;
        const target = points[index];
        const distanceToTarget = Phaser.Math.Distance.Between(
          scorpion.x,
          scorpion.y,
          target.x,
          target.y
        );

        if (distanceToTarget <= 3) {
          scorpion.setPosition(target.x, target.y);

          if (index === points.length - 1 && patrolDirection === 1) {
            patrolDirection = -1;
          } else if (index === 0 && patrolDirection === -1) {
            patrolDirection = 1;
          }

          index += patrolDirection;
          scorpion.setData('patrolIndex', index);
          scorpion.setData('patrolDirection', patrolDirection);
          this.setScorpionVelocityToTarget(scorpion);
        }

        const nextMirrorAt = scorpion.getData('nextMirrorAt') as number;
        if (time >= nextMirrorAt) {
          scorpion.toggleFlipX();
          scorpion.setData('nextMirrorAt', time + 180);
        }
      }

      scorpion.setDepth(scorpion.y);

      const scorpionColumn = Math.floor(scorpion.x / GRID_SIZE) + 1;
      const scorpionGroundY = scorpion.y + SCORPION_SIZE / 2;
      const scorpionRow = Math.floor(scorpionGroundY / GRID_SIZE) + 1;
      const sameCell = scorpionColumn === playerColumn && scorpionRow === playerRow;
      const wasTouching = scorpion.getData('touchingPlayerCell') === true;

      if (sameCell && !wasTouching) {
        this.damagePlayer(SCORPION_DAMAGE);
      }
      scorpion.setData('touchingPlayerCell', sameCell);

      for (const ray of this.magicRays) {
        if (!ray.active) continue;

        const rayColumn = Math.floor(ray.x / GRID_SIZE) + 1;
        const rayRow = Math.floor(ray.y / GRID_SIZE) + 1;

        if (rayColumn === scorpionColumn && rayRow === scorpionRow) {
          ray.destroy();
          scorpion.destroy();
          break;
        }
      }
    }

    this.scorpions = this.scorpions.filter((scorpion) => scorpion.active);
    this.magicRays = this.magicRays.filter((ray) => ray.active);
  }

  private damagePlayer(amount: number): void {
    const progress = getVillageProgress();
    const nextEnergy = Math.max(0, progress.energy - amount);

    setVillageEnergy(nextEnergy);
    this.registry.set(REGISTRY_ENERGY_KEY, nextEnergy);
    this.ui.updateEnergy(nextEnergy);

    this.cameras.main.shake(180, 0.007);
    this.player.setTint(0xff5544);
    this.time.delayedCall(180, () => {
      if (this.player.active) this.player.clearTint();
    });

    if (nextEnergy === 0 && !this.isGameOver) {
      this.isGameOver = true;
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0);
      this.player.anims.stop();

      this.time.delayedCall(220, () => {
        this.scene.launch('GameOverScene', {
          characterId: this.characterId,
          sourceSceneKey: 'DesertScene'
        });
        this.scene.pause();
      });
    }
  }

  private createPlayer(): void {
    const makeAnimation = (key: Facing, frames: string[]): void => {
      const animationKey = `desert-walk-${key}`;
      if (this.anims.exists(animationKey)) return;

      this.anims.create({
        key: animationKey,
        frames: frames.map((frame) => ({ key: frame })),
        frameRate: key === 'side' ? 8 : 6,
        repeat: -1
      });
    };

    makeAnimation('down', ['desert-player-down1', 'desert-player-down2']);
    makeAnimation('side', [
      'desert-player-side1',
      'desert-player-side',
      'desert-player-side2',
      'desert-player-side'
    ]);
    makeAnimation('up', ['desert-player-up1', 'desert-player-up2']);

    this.player = this.physics.add.sprite(
      PLAYER_START.x,
      PLAYER_START.y,
      'desert-player-side'
    );

    this.player
      .setDisplaySize(PLAYER_SIZE, PLAYER_SIZE)
      .setDepth(PLAYER_START.y + PLAYER_FOOT_OFFSET_Y)
      .setCollideWorldBounds(true);

    (this.player.body as Phaser.Physics.Arcade.Body)
      .setSize(28, 24)
      .setOffset(18, 36);
  }

  private shootMagicRay(): void {
    const shotDirection = this.direction.clone().normalize();
    const spawnPosition = new Phaser.Math.Vector2(this.player.x, this.player.y)
      .add(shotDirection.clone().scale(MAGIC_RAY_SPAWN_OFFSET));

    const ray = this.physics.add.image(
      spawnPosition.x,
      spawnPosition.y,
      'playable-magicRayGold'
    )
      .setDisplaySize(64, 24)
      .setRotation(shotDirection.angle())
      .setDepth(60);

    this.ui.ignoreWorldObject(ray);

    const body = ray.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(22, 22, true);
    body.setVelocity(
      shotDirection.x * MAGIC_RAY_SPEED,
      shotDirection.y * MAGIC_RAY_SPEED
    );

    this.magicRays.push(ray);

    this.time.delayedCall(MAGIC_RAY_LIFETIME, () => {
      if (ray.active) ray.destroy();
      this.magicRays = this.magicRays.filter((activeRay) => activeRay.active);
    });
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
    context.font = '7px Arial';

    for (let column = 0; column <= WORLD_COLUMNS; column += 1) {
      const x = column * GRID_SIZE + 0.5;
      context.beginPath();
      context.strokeStyle = column % 5 === 0
        ? 'rgba(255,244,180,0.62)'
        : 'rgba(255,255,255,0.28)';
      context.lineWidth = column % 5 === 0 ? 1.5 : 1;
      context.moveTo(x, 0);
      context.lineTo(x, WORLD_HEIGHT);
      context.stroke();
    }

    for (let row = 0; row <= WORLD_ROWS; row += 1) {
      const y = row * GRID_SIZE + 0.5;
      context.beginPath();
      context.strokeStyle = row % 5 === 0
        ? 'rgba(255,244,180,0.62)'
        : 'rgba(255,255,255,0.28)';
      context.lineWidth = row % 5 === 0 ? 1.5 : 1;
      context.moveTo(0, y);
      context.lineTo(WORLD_WIDTH, y);
      context.stroke();
    }

    for (let row = 1; row <= WORLD_ROWS; row += 1) {
      for (let column = 1; column <= WORLD_COLUMNS; column += 1) {
        const x = (column - 1) * GRID_SIZE + 2;
        const y = (row - 1) * GRID_SIZE + 2;
        const label = `C${String(column).padStart(2, '0')}/F${String(row).padStart(2, '0')}`;

        context.lineWidth = 2;
        context.strokeStyle = 'rgba(50,28,12,0.78)';
        context.strokeText(label, x, y);
        context.fillStyle = 'rgba(255,240,185,0.88)';
        context.fillText(label, x, y);
      }
    }

    texture.refresh();

    this.add.image(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      GRID_TEXTURE_KEY
    )
      .setDepth(10000)
      .setAlpha(0.95);
  }
}

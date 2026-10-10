import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';
import {
  createPlayableUi,
  preloadPlayableUiAssets,
  type PlayableUiController
} from '../playableSceneUi';
import { getVillageProgress, setVillageEnergy } from '../villageProgress';

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

const SNAKE_START_CELL = { column: 77, row: 13 } as const;
const SNAKE_END_CELL = { column: 13, row: 13 } as const;
const SNAKE_SPEED = 72;
const SNAKE_WIDTH = 38;
const SNAKE_HEIGHT = 19;
const SNAKE_DAMAGE = 10;
const SNAKE_DAMAGE_COOLDOWN_MS = 1000;

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
  private snake?: Phaser.Physics.Arcade.Sprite;
  private snakeDamageCooldownUntil = 0;

  constructor() {
    super('DesertScene');
  }

  init(data: DesertSceneData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.facing = 'side';
    this.direction.set(1, 0);
    this.lastShotAt = 0;
    this.snake = undefined;
    this.snakeDamageCooldownUntil = 0;
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
    this.createSnake();

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

  update(time: number): void {
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
      body.setVelocity(movement.x * PLAYER_SPEED, movement.y * PLAYER_SPEED);
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
    this.updateSnake();

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

  private createSnake(): void {
    const startX = (SNAKE_START_CELL.column - 0.5) * GRID_SIZE;
    const startY = (SNAKE_START_CELL.row - 0.5) * GRID_SIZE;
    const endX = (SNAKE_END_CELL.column - 0.5) * GRID_SIZE;

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

    this.snake = this.physics.add.sprite(startX, startY, 'desert-snake-01');
    this.snake
      .setDisplaySize(SNAKE_WIDTH, SNAKE_HEIGHT)
      .setDepth(startY)
      .setData('startX', startX)
      .setData('endX', endX);

    const body = this.snake.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(SNAKE_WIDTH * 0.8, SNAKE_HEIGHT * 0.7, true);
    body.setVelocityX(-SNAKE_SPEED);

    this.snake.play('desert-snake-slither');

    this.physics.add.overlap(this.player, this.snake, () => {
      this.damagePlayerFromSnake();
    });
  }

  private updateSnake(): void {
    const snake = this.snake;
    if (!snake?.active) return;

    const startX = snake.getData('startX') as number;
    const endX = snake.getData('endX') as number;
    const body = snake.body as Phaser.Physics.Arcade.Body;

    snake.setDepth(snake.y);

    if (snake.x <= endX) {
      snake.setX(endX);
      snake.setFlipX(true);
      body.setVelocityX(SNAKE_SPEED);
    } else if (snake.x >= startX) {
      snake.setX(startX);
      snake.setFlipX(false);
      body.setVelocityX(-SNAKE_SPEED);
    }
  }

  private damagePlayerFromSnake(): void {
    const now = this.time.now;
    if (now < this.snakeDamageCooldownUntil) return;

    this.snakeDamageCooldownUntil = now + SNAKE_DAMAGE_COOLDOWN_MS;

    const progress = getVillageProgress();
    const nextEnergy = Math.max(0, progress.energy - SNAKE_DAMAGE);

    setVillageEnergy(nextEnergy);
    this.registry.set(REGISTRY_ENERGY_KEY, nextEnergy);
    this.ui.updateEnergy(nextEnergy);

    this.player.setTintFill(0xff6b5f);
    this.time.delayedCall(160, () => {
      if (this.player.active) this.player.clearTint();
    });
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

    const snake = this.snake;
    if (snake?.active) {
      this.physics.add.overlap(ray, snake, () => {
        if (ray.active) ray.destroy();
        if (snake.active) snake.destroy();
        if (this.snake === snake) this.snake = undefined;
      });
    }

    this.time.delayedCall(MAGIC_RAY_LIFETIME, () => {
      if (ray.active) ray.destroy();
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

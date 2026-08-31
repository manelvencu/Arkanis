import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';
import { createPlayableUi, preloadPlayableUiAssets, type PlayableUiController } from '../playableSceneUi';

interface AldeaData {
  characterId?: CharacterId;
}

type Facing = 'down' | 'up' | 'side';

const GRID = 32;
const WORLD_COLUMNS = 30;
const WORLD_ROWS = 22;
const WORLD_WIDTH = WORLD_COLUMNS * GRID;
const WORLD_HEIGHT = WORLD_ROWS * GRID;
const PLAYER_SIZE = 64;
const PLAYER_START = { x: 92, y: WORLD_HEIGHT - 86 };
const ROAD_WIDTH = 105;
const GRID_TEXTURE_KEY = 'aldea-grid-debug-overlay';
const MAGIC_RAY_SPEED = 430;
const MAGIC_RAY_SPAWN_OFFSET = 36;
const MAGIC_RAY_LIFETIME = 900;

// Cabañas de La Aldea: 192x144 px (aprox. 6x4,5 celdas).
// La coordenada indicada representa el centro horizontal de la base;
// la imagen crece visualmente hacia arriba gracias al origen (0.5, 1).
const CABIN_ONE = {
  x: (5 - 0.5) * GRID,
  baseY: 18 * GRID,
  width: 192,
  height: 144
} as const;

const CABIN_TWO = {
  x: (6 - 0.5) * GRID,
  baseY: 10 * GRID,
  width: 192,
  height: 144
} as const;

const ENVIRONMENT_ASSETS = {
  grass: './assets/environment/grass-tile-01.png',
  dirt: './assets/environment/dirt-ground-01.png',
  cabin: './assets/environment/cabin-stone-thatch-01.png'
} as const;

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

export class AldeaScene extends Phaser.Scene {
  private characterId: CharacterId = 'tiana';
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private facing: Facing = 'side';
  private direction = new Phaser.Math.Vector2(1, 0);
  private lastShotAt = 0;
  private ui!: PlayableUiController;

  constructor() {
    super('AldeaScene');
  }

  init(data: AldeaData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.facing = 'side';
    this.direction.set(1, 0);
    this.lastShotAt = 0;
  }

  preload(): void {
    Object.entries(ENVIRONMENT_ASSETS).forEach(([key, path]) => {
      this.load.image(`aldea-${key}`, path);
    });
    preloadPlayableUiAssets(this);

    const characterKey = this.characterId === 'lupe' ? 'lupe' : 'tiana';
    Object.entries(CHARACTER_ASSETS[characterKey]).forEach(([key, path]) => {
      this.load.image(`aldea-player-${key}`, path);
    });
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#6e934a');

    this.createTerrain();
    this.createCabins();
    this.createGridOverlay();
    this.createPlayer();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(850, 8, 7, 17);

    const character = characters.find((item) => item.id === this.characterId) ?? characters[0];
    this.ui = createPlayableUi(this, this.characterId, character.name, 100, 0);
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
      body.setVelocity(movement.x * 180, movement.y * 180);
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

      this.player.anims.play(`aldea-walk-${this.facing}`, true);
    } else {
      this.player.anims.stop();
      const idleKey = this.facing === 'side' ? 'side' : this.facing;
      this.player.setTexture(`aldea-player-${idleKey}`);
    }

    const keyboardShot = Phaser.Input.Keyboard.JustDown(this.spaceKey);
    const touchShot = this.ui.consumeShootRequest();
    if ((keyboardShot || touchShot) && time - this.lastShotAt > 250) {
      this.shootMagicRay();
      this.lastShotAt = time;
    }
  }

  private createTerrain(): void {
    const grass = this.add.tileSprite(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      WORLD_WIDTH,
      WORLD_HEIGHT,
      'aldea-grass'
    ).setDepth(0);
    const grassSource = grass.texture.getSourceImage() as { width: number; height: number };
    grass.setTileScale(128 / grassSource.width, 128 / grassSource.height);

    const roadPoints = [
      new Phaser.Math.Vector2(-20, 660),
      new Phaser.Math.Vector2(92, 626),
      new Phaser.Math.Vector2(175, 646),
      new Phaser.Math.Vector2(245, 590),
      new Phaser.Math.Vector2(318, 605),
      new Phaser.Math.Vector2(370, 535),
      new Phaser.Math.Vector2(430, 500),
      new Phaser.Math.Vector2(405, 445),
      new Phaser.Math.Vector2(470, 405),
      new Phaser.Math.Vector2(535, 370),
      new Phaser.Math.Vector2(590, 315),
      new Phaser.Math.Vector2(565, 265),
      new Phaser.Math.Vector2(650, 230),
      new Phaser.Math.Vector2(705, 170),
      new Phaser.Math.Vector2(780, 185),
      new Phaser.Math.Vector2(845, 120),
      new Phaser.Math.Vector2(925, 95),
      new Phaser.Math.Vector2(985, 45)
    ];

    const road = this.add.graphics().setDepth(1);
    road.lineStyle(ROAD_WIDTH, 0xb68b55, 1);
    road.beginPath();
    road.moveTo(roadPoints[0].x, roadPoints[0].y);
    for (let i = 1; i < roadPoints.length; i += 1) {
      road.lineTo(roadPoints[i].x, roadPoints[i].y);
    }
    road.strokePath();

    this.add.circle(500, 375, 150, 0xb68b55, 1).setDepth(1);

    const dirtOverlay = this.add.tileSprite(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      WORLD_WIDTH,
      WORLD_HEIGHT,
      'aldea-dirt'
    ).setDepth(2).setAlpha(0.10);
    const dirtSource = dirtOverlay.texture.getSourceImage() as { width: number; height: number };
    dirtOverlay.setTileScale(128 / dirtSource.width, 128 / dirtSource.height);
  }

  private createCabins(): void {
    [CABIN_ONE, CABIN_TWO].forEach((cabin) => {
      this.add.image(cabin.x, cabin.baseY, 'aldea-cabin')
        .setOrigin(0.5, 1)
        .setDisplaySize(cabin.width, cabin.height)
        .setDepth(10);
    });
  }

  private createPlayer(): void {
    const makeAnimation = (key: Facing, frames: string[]): void => {
      const animationKey = `aldea-walk-${key}`;
      if (this.anims.exists(animationKey)) return;
      this.anims.create({
        key: animationKey,
        frames: frames.map((frame) => ({ key: frame })),
        frameRate: 6,
        repeat: -1
      });
    };

    makeAnimation('down', ['aldea-player-down1', 'aldea-player-down2']);
    makeAnimation('side', ['aldea-player-side1', 'aldea-player-side2']);
    makeAnimation('up', ['aldea-player-up1', 'aldea-player-up2']);

    this.player = this.physics.add.sprite(PLAYER_START.x, PLAYER_START.y, 'aldea-player-side');
    this.player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE).setDepth(30).setCollideWorldBounds(true);
    this.player.setFlipX(false);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(28, 24).setOffset(18, 36);
  }

  private shootMagicRay(): void {
    const shotDirection = this.direction.clone().normalize();
    const spawnPosition = new Phaser.Math.Vector2(this.player.x, this.player.y)
      .add(shotDirection.clone().scale(MAGIC_RAY_SPAWN_OFFSET));

    const ray = this.physics.add.image(spawnPosition.x, spawnPosition.y, 'playable-magicRayGold')
      .setDisplaySize(64, 24)
      .setRotation(shotDirection.angle())
      .setDepth(60);
    this.ui.ignoreWorldObject(ray);

    const body = ray.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(22, 22, true);
    body.setVelocity(shotDirection.x * MAGIC_RAY_SPEED, shotDirection.y * MAGIC_RAY_SPEED);

    this.time.delayedCall(MAGIC_RAY_LIFETIME, () => {
      if (ray.active) ray.destroy();
    });
  }

  private createGridOverlay(): void {
    if (this.textures.exists(GRID_TEXTURE_KEY)) this.textures.remove(GRID_TEXTURE_KEY);
    const texture = this.textures.createCanvas(GRID_TEXTURE_KEY, WORLD_WIDTH, WORLD_HEIGHT);
    if (!texture) return;

    const context = texture.context;
    context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    context.textBaseline = 'top';
    context.font = '7px Arial';

    for (let column = 0; column <= WORLD_COLUMNS; column += 1) {
      const x = column * GRID + 0.5;
      context.beginPath();
      context.strokeStyle = column % 5 === 0 ? 'rgba(255,245,175,0.52)' : 'rgba(255,255,255,0.24)';
      context.lineWidth = column % 5 === 0 ? 1.5 : 1;
      context.moveTo(x, 0);
      context.lineTo(x, WORLD_HEIGHT);
      context.stroke();
    }

    for (let row = 0; row <= WORLD_ROWS; row += 1) {
      const y = row * GRID + 0.5;
      context.beginPath();
      context.strokeStyle = row % 5 === 0 ? 'rgba(255,245,175,0.52)' : 'rgba(255,255,255,0.24)';
      context.lineWidth = row % 5 === 0 ? 1.5 : 1;
      context.moveTo(0, y);
      context.lineTo(WORLD_WIDTH, y);
      context.stroke();
    }

    for (let row = 1; row <= WORLD_ROWS; row += 1) {
      for (let column = 1; column <= WORLD_COLUMNS; column += 1) {
        const x = (column - 1) * GRID + 2;
        const y = (row - 1) * GRID + 2;
        const label = `C${String(column).padStart(2, '0')}/F${String(row).padStart(2, '0')}`;
        context.lineWidth = 2;
        context.strokeStyle = 'rgba(0,0,0,0.72)';
        context.strokeText(label, x, y);
        context.fillStyle = 'rgba(255,244,170,0.82)';
        context.fillText(label, x, y);
      }
    }

    texture.refresh();
    this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, GRID_TEXTURE_KEY)
      .setDepth(900)
      .setAlpha(0.9);
  }
}

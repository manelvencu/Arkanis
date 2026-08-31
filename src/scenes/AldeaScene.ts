import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';
import { createPlayableUi, preloadPlayableUiAssets, type PlayableUiController } from '../playableSceneUi';

interface AldeaData {
  characterId?: CharacterId;
}

type Facing = 'down' | 'up' | 'side';

type CabinConfig = {
  x: number;
  baseY: number;
  width: number;
  height: number;
  texture: string;
};

const GRID = 32;
const WORLD_COLUMNS = 30;
const WORLD_ROWS = 22;
const WORLD_WIDTH = WORLD_COLUMNS * GRID;
const WORLD_HEIGHT = WORLD_ROWS * GRID;
const PLAYER_SIZE = 64;
const PLAYER_START = { x: 92, y: WORLD_HEIGHT - 86 };
const ROAD_WIDTH = 105;
const CABIN_PATH_WIDTH = GRID * 2;
const CABIN_PATH_OVERLAP = 48;
const GRID_TEXTURE_KEY = 'aldea-grid-debug-overlay';
const MAGIC_RAY_SPEED = 430;
const MAGIC_RAY_SPAWN_OFFSET = 36;
const MAGIC_RAY_LIFETIME = 900;

const PLAZA = {
  left: (11 - 1) * GRID,
  top: (8 - 1) * GRID,
  width: 11 * GRID,
  height: 7 * GRID
} as const;
const PLAZA_RIGHT = PLAZA.left + PLAZA.width;
const PLAZA_BOTTOM = PLAZA.top + PLAZA.height;

const CABIN_ONE: CabinConfig = {
  x: (5 - 0.5) * GRID,
  baseY: 18 * GRID,
  width: 192,
  height: 144,
  texture: 'aldea-cabin'
};

const CABIN_TWO: CabinConfig = {
  x: (6 - 0.5) * GRID,
  baseY: 10 * GRID,
  width: 192,
  height: 144,
  texture: 'aldea-cabin'
};

const CABIN_THREE: CabinConfig = {
  x: (12 - 0.5) * GRID,
  baseY: 6 * GRID,
  width: 192,
  height: 144,
  texture: 'aldea-cabin'
};

const CABIN_FOUR: CabinConfig = {
  x: (22 - 0.5) * GRID,
  baseY: 19 * GRID,
  width: 192,
  height: 144,
  texture: 'aldea-cabin-ivory'
};

const CABIN_FIVE: CabinConfig = {
  x: (26 - 0.5) * GRID,
  baseY: 13 * GRID,
  width: 192,
  height: 144,
  texture: 'aldea-cabin-ivory'
};

const CHURCH = {
  x: (19 - 0.5) * GRID,
  baseY: 7 * GRID,
  width: 240,
  height: 224
} as const;

const FOREST_TREES = [
  { x: 42, y: 118, width: 118, height: 152 },
  { x: 108, y: 82, width: 126, height: 162 },
  { x: 178, y: 112, width: 116, height: 150 },
  { x: 246, y: 74, width: 128, height: 166 },
  { x: 70, y: 206, width: 132, height: 170 },
  { x: 160, y: 214, width: 122, height: 160 },
  { x: 252, y: 188, width: 126, height: 164 }
] as const;

const ENVIRONMENT_ASSETS = {
  grass: './assets/environment/grass-tile-01.png',
  dirt: './assets/environment/dirt-ground-01.png',
  stoneFloor: './assets/environment/stone-floor-tile-01.png',
  cabin: './assets/environment/cabin-stone-thatch-01.png',
  cabinIvory: './assets/environment/cabin-ivory-redtile-01.png',
  church: './assets/environment/church-stone-belltower-01.png',
  tree: './assets/environment/tree-large-01.png'
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
  private worldColliders: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super('AldeaScene');
  }

  init(data: AldeaData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.facing = 'side';
    this.direction.set(1, 0);
    this.lastShotAt = 0;
    this.worldColliders = [];
  }

  preload(): void {
    Object.entries(ENVIRONMENT_ASSETS).forEach(([key, path]) => {
      let textureKey = `aldea-${key}`;
      if (key === 'cabinIvory') textureKey = 'aldea-cabin-ivory';
      if (key === 'stoneFloor') textureKey = 'aldea-stoneFloor';
      this.load.image(textureKey, path);
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
    this.createForestEdge();
    this.createBuildings();
    this.createGridOverlay();
    this.createPlayer();
    this.createWorldCollisions();

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

    const dirtSource = this.textures.get('aldea-dirt').getSourceImage() as { width: number; height: number };
    const dirtScaleX = 128 / dirtSource.width;
    const dirtScaleY = 128 / dirtSource.height;

    const addDirtSegment = (a: Phaser.Math.Vector2, b: Phaser.Math.Vector2, width: number): void => {
      const horizontal = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
      const segmentWidth = horizontal ? Math.abs(b.x - a.x) + width : width;
      const segmentHeight = horizontal ? width : Math.abs(b.y - a.y) + width;
      this.add.tileSprite(
        (a.x + b.x) / 2,
        (a.y + b.y) / 2,
        segmentWidth,
        segmentHeight,
        'aldea-dirt'
      ).setDepth(1).setTileScale(dirtScaleX, dirtScaleY);
    };

    const addRoundedDirtJoint = (point: Phaser.Math.Vector2, width: number): void => {
      const joint = this.add.tileSprite(point.x, point.y, width, width, 'aldea-dirt')
        .setDepth(1)
        .setTileScale(dirtScaleX, dirtScaleY);
      const maskShape = this.make.graphics({ x: 0, y: 0 });
      maskShape.fillStyle(0xffffff, 1);
      maskShape.fillCircle(point.x, point.y, width / 2);
      joint.setMask(maskShape.createGeometryMask());
    };

    const drawTexturedPath = (points: Phaser.Math.Vector2[], width: number): void => {
      for (let i = 1; i < points.length; i += 1) addDirtSegment(points[i - 1], points[i], width);
      points.forEach((point) => addRoundedDirtJoint(point, width));
    };

    drawTexturedPath([
      new Phaser.Math.Vector2(-ROAD_WIDTH / 2, 656),
      new Phaser.Math.Vector2(272, 656),
      new Phaser.Math.Vector2(272, PLAZA_BOTTOM),
      new Phaser.Math.Vector2(PLAZA.left, PLAZA_BOTTOM)
    ], ROAD_WIDTH);

    drawTexturedPath([
      new Phaser.Math.Vector2(PLAZA_RIGHT, 256),
      new Phaser.Math.Vector2(864, 256),
      new Phaser.Math.Vector2(864, 96),
      new Phaser.Math.Vector2(WORLD_WIDTH + ROAD_WIDTH / 2, 96)
    ], ROAD_WIDTH);

    drawTexturedPath([
      new Phaser.Math.Vector2(CABIN_ONE.x, CABIN_ONE.baseY - CABIN_PATH_OVERLAP),
      new Phaser.Math.Vector2(CABIN_ONE.x, CABIN_ONE.baseY + GRID * 2),
      new Phaser.Math.Vector2((11.5 - 0.5) * GRID, CABIN_ONE.baseY + GRID * 2),
      new Phaser.Math.Vector2((11.5 - 0.5) * GRID, PLAZA_BOTTOM)
    ], CABIN_PATH_WIDTH);

    drawTexturedPath([
      new Phaser.Math.Vector2(CABIN_TWO.x, CABIN_TWO.baseY - CABIN_PATH_OVERLAP),
      new Phaser.Math.Vector2(CABIN_TWO.x, 12 * GRID),
      new Phaser.Math.Vector2(PLAZA.left, 12 * GRID)
    ], CABIN_PATH_WIDTH);

    drawTexturedPath([
      new Phaser.Math.Vector2(CABIN_THREE.x, CABIN_THREE.baseY - CABIN_PATH_OVERLAP),
      new Phaser.Math.Vector2(CABIN_THREE.x, PLAZA.top)
    ], CABIN_PATH_WIDTH);

    const cabinFourLaneY = 21 * GRID;
    const cabinFourLaneX = 17 * GRID;
    drawTexturedPath([
      new Phaser.Math.Vector2(CABIN_FOUR.x, CABIN_FOUR.baseY - CABIN_PATH_OVERLAP),
      new Phaser.Math.Vector2(CABIN_FOUR.x, cabinFourLaneY),
      new Phaser.Math.Vector2(cabinFourLaneX, cabinFourLaneY),
      new Phaser.Math.Vector2(cabinFourLaneX, PLAZA_BOTTOM)
    ], CABIN_PATH_WIDTH);

    drawTexturedPath([
      new Phaser.Math.Vector2(CABIN_FIVE.x, CABIN_FIVE.baseY - CABIN_PATH_OVERLAP),
      new Phaser.Math.Vector2(CABIN_FIVE.x, CABIN_FIVE.baseY + GRID),
      new Phaser.Math.Vector2(PLAZA_RIGHT, CABIN_FIVE.baseY + GRID)
    ], CABIN_PATH_WIDTH);

    const plaza = this.add.tileSprite(
      PLAZA.left,
      PLAZA.top,
      PLAZA.width,
      PLAZA.height,
      'aldea-stoneFloor'
    ).setOrigin(0, 0).setDepth(3);
    const stoneSource = plaza.texture.getSourceImage() as { width: number; height: number };
    plaza.setTileScale(128 / stoneSource.width, 128 / stoneSource.height);
  }

  private createForestEdge(): void {
    FOREST_TREES.forEach((treeConfig, index) => {
      this.add.image(treeConfig.x, treeConfig.y, 'aldea-tree')
        .setOrigin(0.5, 1)
        .setDisplaySize(treeConfig.width, treeConfig.height)
        .setDepth(8 + index * 0.01);

      const blocker = this.add.rectangle(
        treeConfig.x,
        treeConfig.y - 18,
        Math.max(34, treeConfig.width * 0.36),
        36,
        0x000000,
        0
      );
      this.physics.add.existing(blocker, true);
      this.worldColliders.push(blocker);
    });
  }

  private createBuildings(): void {
    [CABIN_ONE, CABIN_TWO, CABIN_THREE, CABIN_FOUR, CABIN_FIVE].forEach((cabin) => {
      this.add.image(cabin.x, cabin.baseY, cabin.texture)
        .setOrigin(0.5, 1)
        .setDisplaySize(cabin.width, cabin.height)
        .setDepth(10);

      const blocker = this.add.rectangle(
        cabin.x,
        cabin.baseY - cabin.height / 2,
        cabin.width,
        cabin.height,
        0x000000,
        0
      );
      this.physics.add.existing(blocker, true);
      this.worldColliders.push(blocker);
    });

    this.add.image(CHURCH.x, CHURCH.baseY, 'aldea-church')
      .setOrigin(0.5, 1)
      .setDisplaySize(CHURCH.width, CHURCH.height)
      .setDepth(11);

    const churchBlocker = this.add.rectangle(
      CHURCH.x,
      CHURCH.baseY - CHURCH.height / 2,
      CHURCH.width,
      CHURCH.height,
      0x000000,
      0
    );
    this.physics.add.existing(churchBlocker, true);
    this.worldColliders.push(churchBlocker);
  }

  private createWorldCollisions(): void {
    this.worldColliders.forEach((blocker) => {
      this.physics.add.collider(this.player, blocker);
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

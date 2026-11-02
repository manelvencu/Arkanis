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
const MAGIC_RAY_SPEED = 430;
const MAGIC_RAY_SPAWN_OFFSET = 36;
const MAGIC_RAY_LIFETIME = 900;

const GRASS_CLEARING = new Phaser.Geom.Rectangle(
  (7 - 1) * GRID,
  (14 - 1) * GRID,
  4 * GRID,
  6 * GRID
);

const EXIT_ZONE = new Phaser.Geom.Rectangle(
  (30 - 1) * GRID,
  (2 - 1) * GRID,
  GRID,
  4 * GRID
);

const CABIN_ONE: CabinConfig = {
  // Dos columnas a la derecha (64 px); no cambia la cota vertical.
  x: (7 - 0.5) * GRID,
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

const VILLAGE_BACKGROUND_KEY = 'aldea-world-background';
const VILLAGE_BACKGROUND_PATH = './assets/world/aldea-world-01.png';

const ENVIRONMENT_ASSETS = {
  cabin: './assets/environment/cabin-stone-thatch-01.png',
  cabinIvory: './assets/environment/cabin-ivory-redtile-01.png',
  church: './assets/environment/church-stone-belltower-01.png'
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
  private walkableAreas: Phaser.Geom.Rectangle[] = [];
  private lastWalkablePosition = new Phaser.Math.Vector2(PLAYER_START.x, PLAYER_START.y);
  private exitStarted = false;

  constructor() {
    super('AldeaScene');
  }

  init(data: AldeaData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.facing = 'side';
    this.direction.set(1, 0);
    this.lastShotAt = 0;
    this.worldColliders = [];
    this.walkableAreas = [];
    this.lastWalkablePosition.set(PLAYER_START.x, PLAYER_START.y);
    this.exitStarted = false;
  }

  preload(): void {
    this.load.image(VILLAGE_BACKGROUND_KEY, VILLAGE_BACKGROUND_PATH);
    Object.entries(ENVIRONMENT_ASSETS).forEach(([key, path]) => {
      const textureKey = key === 'cabinIvory' ? 'aldea-cabin-ivory' : `aldea-${key}`;
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

    // Fondo orgánico único: ya incluye hierba, caminos, plaza, árboles y arbustos.
    // Las construcciones y la fuente se siguen dibujando como objetos independientes.
    this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, VILLAGE_BACKGROUND_KEY)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(0);
    this.createBuildings();
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

    if (!this.exitStarted) {
      const footX = this.player.x;
      const footY = this.player.y + 20;
      if (this.isWalkablePoint(footX, footY)) {
        this.lastWalkablePosition.set(this.player.x, this.player.y);
      } else {
        this.player.setPosition(this.lastWalkablePosition.x, this.lastWalkablePosition.y);
      }

      if (Phaser.Geom.Rectangle.Contains(EXIT_ZONE, this.player.x, this.player.y)) {
        this.beginExitTransition();
        return;
      }
    }

    body.setVelocity(0);
    if (this.exitStarted) return;

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
    this.lastWalkablePosition.set(this.player.x, this.player.y);
  }

  private isWalkablePoint(x: number, y: number): boolean {
    if (Phaser.Geom.Rectangle.Contains(GRASS_CLEARING, x, y)) return false;
    return this.walkableAreas.some((area) => Phaser.Geom.Rectangle.Contains(area, x, y));
  }

  private beginExitTransition(): void {
    if (this.exitStarted) return;
    this.exitStarted = true;
    this.player.anims.stop();
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
    this.cameras.main.fadeOut(700, 8, 7, 17);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('WorldMapScene', {
        characterId: this.characterId,
        startAtMap: true,
        destination: 'fire'
      });
    });
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

}
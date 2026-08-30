import * as Phaser from 'phaser';
import type { CharacterId } from '../gameData';

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

const ENVIRONMENT_ASSETS = {
  grass: './assets/environment/grass-tile-01.png',
  dirt: './assets/environment/dirt-ground-01.png',
  path: './assets/environment/dirt-path-tile-01.png'
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
  private facing: Facing = 'side';

  constructor() {
    super('AldeaScene');
  }

  init(data: AldeaData): void {
    this.characterId = data.characterId ?? 'tiana';
  }

  preload(): void {
    Object.entries(ENVIRONMENT_ASSETS).forEach(([key, path]) => {
      this.load.image(`aldea-${key}`, path);
    });

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
    this.createPlayer();

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(850, 8, 7, 17);
  }

  update(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let x = 0;
    let y = 0;
    if (this.cursors.left.isDown) x -= 1;
    if (this.cursors.right.isDown) x += 1;
    if (this.cursors.up.isDown) y -= 1;
    if (this.cursors.down.isDown) y += 1;

    if (x !== 0 || y !== 0) {
      const movement = new Phaser.Math.Vector2(x, y).normalize();
      body.setVelocity(movement.x * 180, movement.y * 180);

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

    // Camino irregular desde la esquina inferior izquierda hasta la superior derecha.
    const roadPoints = [
      new Phaser.Math.Vector2(-10, 650),
      new Phaser.Math.Vector2(125, 620),
      new Phaser.Math.Vector2(215, 565),
      new Phaser.Math.Vector2(320, 515),
      new Phaser.Math.Vector2(395, 455),
      new Phaser.Math.Vector2(480, 395),
      new Phaser.Math.Vector2(555, 330),
      new Phaser.Math.Vector2(650, 270),
      new Phaser.Math.Vector2(735, 205),
      new Phaser.Math.Vector2(825, 140),
      new Phaser.Math.Vector2(970, 70)
    ];

    const road = this.add.graphics().setDepth(1);
    road.lineStyle(150, 0xb68b55, 1);
    road.beginPath();
    road.moveTo(roadPoints[0].x, roadPoints[0].y);
    for (let i = 1; i < roadPoints.length; i += 1) {
      road.lineTo(roadPoints[i].x, roadPoints[i].y);
    }
    road.strokePath();

    // Plaza circular central por la que atraviesa el camino.
    this.add.circle(500, 375, 150, 0xb68b55, 1).setDepth(1);

    // Textura de tierra superpuesta de forma suave para mantener el aspecto ilustrado.
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
}

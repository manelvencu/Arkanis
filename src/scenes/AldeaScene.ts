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
const PLAYER_START = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT - 78 };

const ENVIRONMENT_ASSETS = {
  grass: './assets/environment/grass-tile-01.png',
  dirt: './assets/environment/dirt-ground-01.png',
  path: './assets/environment/dirt-path-tile-01.png',
  tree: './assets/environment/tree-large-01.png',
  bush: './assets/environment/bush-small-01.png',
  rock: './assets/environment/rock-small-01.png',
  cabin: './assets/environment/cabin-stone-thatch-01.png',
  coin: './assets/environment/coin-gold-01.png'
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
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private facing: Facing = 'up';

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
    this.solids = this.physics.add.staticGroup();
    this.createVillageBorder();
    this.createBuildings();
    this.createVillageDetails();
    this.createNpcPlaceholders();
    this.createPlayer();

    this.physics.add.collider(this.player, this.solids);
    this.cursors = this.input.keyboard!.createCursorKeys();

    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(850, 8, 7, 17);

    this.showAreaTitle();
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
    const grass = this.add.tileSprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 'aldea-grass');
    const grassSource = grass.texture.getSourceImage() as { width: number; height: number };
    grass.setTileScale(128 / grassSource.width, 128 / grassSource.height).setDepth(0);

    const mainRoad = this.add.tileSprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 35, 160, WORLD_HEIGHT - 90, 'aldea-path');
    const roadSource = mainRoad.texture.getSourceImage() as { width: number; height: number };
    mainRoad.setTileScale(128 / roadSource.width, 128 / roadSource.height).setDepth(1);

    const plaza = this.add.ellipse(WORLD_WIDTH / 2, 365, 390, 250, 0xb58a55, 0.82).setDepth(1);
    plaza.setStrokeStyle(4, 0x8b683f, 0.6);

    this.add.tileSprite(250, 350, 300, 90, 'aldea-dirt').setAlpha(0.55).setDepth(1);
    this.add.tileSprite(710, 350, 300, 90, 'aldea-dirt').setAlpha(0.55).setDepth(1);
  }

  private createVillageBorder(): void {
    const trees: Array<[number, number]> = [
      [70, 70], [190, 70], [310, 65], [650, 65], [770, 70], [890, 70],
      [62, 200], [62, 350], [62, 515], [62, 650],
      [898, 200], [898, 350], [898, 515], [898, 650],
      [120, 665], [240, 665], [720, 665], [840, 665]
    ];

    trees.forEach(([x, y]) => this.addSolidImage(x, y, 'aldea-tree', 122, 138, 48, 38, 54));

    [[135, 180], [825, 165], [145, 545], [810, 560], [340, 610], [620, 610]].forEach(([x, y]) => {
      this.addSolidImage(x, y, 'aldea-bush', 62, 44, 46, 22, 18);
    });
  }

  private createBuildings(): void {
    const cabins: Array<[number, number, string]> = [
      [235, 225, 'Casa'],
      [720, 220, 'Casa'],
      [235, 475, 'Casa'],
      [720, 470, 'TIENDA']
    ];

    cabins.forEach(([x, y, label]) => {
      this.addSolidImage(x as number, y as number, 'aldea-cabin', 210, 160, 170, 66, 94);
      this.add.text(x as number, (y as number) + 67, label as string, {
        fontFamily: 'IM Fell English, Georgia, serif',
        fontSize: label === 'TIENDA' ? '18px' : '14px',
        color: label === 'TIENDA' ? '#ffe2a1' : '#ead9b5',
        stroke: '#2a160d',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(20);
    });
  }

  private createVillageDetails(): void {
    // Pozo central, creado con geometría provisional hasta tener asset definitivo.
    const well = this.add.container(WORLD_WIDTH / 2, 360).setDepth(12);
    const stone = this.add.ellipse(0, 0, 106, 62, 0x817769, 1).setStrokeStyle(5, 0x4e463d, 1);
    const water = this.add.ellipse(0, -3, 73, 37, 0x477d91, 1).setStrokeStyle(3, 0xb4d0d0, 0.8);
    well.add([stone, water]);

    const wellBody = this.add.rectangle(WORLD_WIDTH / 2, 368, 94, 50, 0xffffff, 0);
    this.physics.add.existing(wellBody, true);
    this.solids.add(wellBody as unknown as Phaser.Physics.Arcade.Image);

    // Vallas / pequeños obstáculos para obligar a rodear elementos.
    this.addFence(355, 510, 150, false);
    this.addFence(605, 535, 145, false);
    this.addFence(360, 165, 110, true);

    [[330, 310], [630, 300], [355, 420], [615, 445]].forEach(([x, y]) => {
      this.addSolidImage(x, y, 'aldea-rock', 42, 34, 32, 24, 8);
    });

    // Tres monedas opcionales para premiar exploración visualmente desde la beta.
    [[145, 420], [820, 390], [480, 145]].forEach(([x, y]) => {
      const coin = this.add.image(x, y, 'aldea-coin').setDisplaySize(24, 24).setDepth(15);
      this.tweens.add({ targets: coin, y: y - 5, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    // Cartel de salida al siguiente mundo, todavía sin transición.
    const sign = this.add.container(WORLD_WIDTH / 2, 82).setDepth(13);
    sign.add([
      this.add.rectangle(0, 0, 170, 58, 0x5f3820, 1).setStrokeStyle(5, 0x2c1a10, 1),
      this.add.text(0, 0, 'CAMINO DEL NORTE', {
        fontFamily: 'IM Fell English, Georgia, serif', fontSize: '15px', color: '#f2d795'
      }).setOrigin(0.5)
    ]);
  }

  private createNpcPlaceholders(): void {
    const npcs: Array<[number, number, number, string]> = [
      [410, 325, 0x9f6046, 'Aldeano'],
      [555, 330, 0x536f8a, 'Aldeana'],
      [420, 465, 0x6e7f4d, 'Viajero'],
      [765, 555, 0x8b5778, 'Mercader']
    ];

    npcs.forEach(([x, y, color, label]) => {
      const body = this.add.ellipse(x, y, 34, 48, color, 1).setStrokeStyle(3, 0x30251f, 0.85).setDepth(16);
      this.add.circle(x, y - 28, 13, 0xe0b48d, 1).setStrokeStyle(2, 0x563927, 0.8).setDepth(17);
      this.add.text(x, y + 40, label, {
        fontFamily: 'IM Fell English, Georgia, serif', fontSize: '12px', color: '#fff0c5', stroke: '#25150d', strokeThickness: 3
      }).setOrigin(0.5).setDepth(18);
      this.physics.add.existing(body, true);
      this.solids.add(body as unknown as Phaser.Physics.Arcade.Image);
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

    this.player = this.physics.add.sprite(PLAYER_START.x, PLAYER_START.y, 'aldea-player-up');
    this.player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE).setDepth(30).setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(28, 24).setOffset(18, 36);
  }

  private addSolidImage(
    x: number,
    y: number,
    texture: string,
    displayWidth: number,
    displayHeight: number,
    bodyWidth: number,
    bodyHeight: number,
    bodyOffsetY: number
  ): Phaser.Physics.Arcade.Image {
    const image = this.physics.add.staticImage(x, y, texture).setDisplaySize(displayWidth, displayHeight).setDepth(10);
    image.refreshBody();
    (image.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(bodyWidth, bodyHeight)
      .setOffset((displayWidth - bodyWidth) / 2, bodyOffsetY);
    this.solids.add(image);
    return image;
  }

  private addFence(x: number, y: number, length: number, vertical: boolean): void {
    const width = vertical ? 18 : length;
    const height = vertical ? length : 18;
    const fence = this.add.rectangle(x, y, width, height, 0x8a5d35, 1)
      .setStrokeStyle(4, 0x4d301c, 1)
      .setDepth(11);
    this.physics.add.existing(fence, true);
    this.solids.add(fence as unknown as Phaser.Physics.Arcade.Image);
  }

  private showAreaTitle(): void {
    const title = this.add.text(480, 135, 'LA ALDEA', {
      fontFamily: 'IM Fell English, Georgia, serif',
      fontSize: '34px',
      color: '#f4d78f',
      stroke: '#24180f',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0).setAlpha(0);

    const subtitle = this.add.text(480, 175, 'Un lugar tranquilo antes de continuar el viaje', {
      fontFamily: 'IM Fell English, Georgia, serif',
      fontSize: '16px',
      color: '#efe1bd',
      stroke: '#24180f',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0).setAlpha(0);

    this.tweens.add({ targets: [title, subtitle], alpha: 1, duration: 650, hold: 1500, yoyo: true });
  }
}

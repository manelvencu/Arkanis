import * as Phaser from 'phaser';
import type { CharacterId } from '../gameData';
import { getTrainingProgress, markTrainingChestRead } from '../trainingProgress';

export interface CabinInteriorData {
  characterId: CharacterId;
}

export interface CabinInteriorConfig {
  sceneKey: string;
  assetPrefix: string;
  chestId: string;
  chestMessage: string;
  returnX: number;
}

type Facing = 'down' | 'up' | 'side';
type TouchDirection = 'left' | 'right' | 'up' | 'down';

const ROOM_WIDTH = 960;
const ROOM_HEIGHT = 540;
const PLAYER_SIZE = 68;
const PLAYER_SPEED = 150;
const TRAINING_RETURN_ROW = 12;
const TRAINING_GRID_SIZE = 32;
const TRAINING_RETURN_Y = (TRAINING_RETURN_ROW - 1) * TRAINING_GRID_SIZE + TRAINING_GRID_SIZE / 2;
const CABIN_ASSET_ROOT = './assets/environment/interiors/cabin/';

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

export abstract class CabinInteriorScene extends Phaser.Scene {
  private readonly cabinConfig: CabinInteriorConfig;
  private characterId: CharacterId = 'tiana';
  private player!: Phaser.Physics.Arcade.Sprite;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private chest!: Phaser.Physics.Arcade.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private facing: Facing = 'up';
  private messageOpen = false;
  private chestOpened = false;
  private chestInRange = false;
  private exiting = false;
  private touchDirections: Record<TouchDirection, boolean> = {
    left: false,
    right: false,
    up: false,
    down: false
  };

  protected constructor(config: CabinInteriorConfig) {
    super(config.sceneKey);
    this.cabinConfig = config;
  }

  init(data: CabinInteriorData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.messageOpen = false;
    this.chestInRange = false;
    this.exiting = false;
    this.touchDirections = { left: false, right: false, up: false, down: false };
    this.chestOpened = getTrainingProgress().readChestIds.includes(this.cabinConfig.chestId);
  }

  preload(): void {
    const p = this.cabinConfig.assetPrefix;
    const loadCabin = (key: string, filename: string): void => this.load.image(`${p}-${key}`, `${CABIN_ASSET_ROOT}${filename}`);
    loadCabin('base', 'cabin-interior-base-01.png');
    loadCabin('bed-left', 'cabin-bed-left-01.png');
    loadCabin('bed-right', 'cabin-bed-right-01.png');
    loadCabin('bedside-left', 'cabin-bedside-table-left-01.png');
    loadCabin('table-main', 'cabin-table-main-01.png');
    loadCabin('chair-left', 'cabin-chair-left-01.png');
    loadCabin('chair-right', 'cabin-chair-right-01.png');
    loadCabin('barrel-right', 'cabin-barrel-right-01.png');
    loadCabin('crate-closed', 'cabin-crate-closed-01.png');
    loadCabin('bookshelf', 'cabin-bookshelf-01.png');
    loadCabin('fireplace', 'cabin-fireplace-01.png');
    loadCabin('rug-small', 'cabin-rug-small-01.png');
    loadCabin('plant-left', 'cabin-plant-pot-left-01.png');
    loadCabin('plant-right', 'cabin-plant-pot-right-01.png');
    this.load.image(`${p}-chest-closed`, './assets/environment/chest-closed-01.png');
    this.load.image(`${p}-chest-open`, './assets/environment/chest-open-01.png');

    const assets = CHARACTER_ASSETS[this.characterId === 'lupe' ? 'lupe' : 'tiana'];
    Object.entries(assets).forEach(([key, path]) => this.load.image(`${p}-player-${key}`, path));
  }

  create(): void {
    const p = this.cabinConfig.assetPrefix;
    this.physics.world.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBackgroundColor('#17100c');
    this.cameras.main.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setZoom(2);
    this.cameras.main.centerOn(ROOM_WIDTH / 2, ROOM_HEIGHT / 2);

    this.createRoom();
    this.createFurniture();
    this.createPlayerAnimations();

    this.player = this.physics.add.sprite(ROOM_WIDTH / 2, ROOM_HEIGHT - 76, `${p}-player-up`);
    this.player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE).setDepth(30).setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(30, 28).setOffset(19, 38);

    this.physics.add.collider(this.player, this.solids);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.createTouchControls();

    this.cameras.main.fadeIn(220, 18, 12, 8);
  }

  update(): void {
    if (this.exiting || this.messageOpen) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
      return;
    }

    const p = this.cabinConfig.assetPrefix;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let x = 0;
    let y = 0;
    if (this.cursors.left.isDown || this.touchDirections.left) x -= 1;
    if (this.cursors.right.isDown || this.touchDirections.right) x += 1;
    if (this.cursors.up.isDown || this.touchDirections.up) y -= 1;
    if (this.cursors.down.isDown || this.touchDirections.down) y += 1;

    if (x !== 0 || y !== 0) {
      const movement = new Phaser.Math.Vector2(x, y).normalize();
      body.setVelocity(movement.x * PLAYER_SPEED, movement.y * PLAYER_SPEED);

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
      this.player.anims.play(`${p}-walk-${this.facing}`, true);
    } else {
      this.player.anims.stop();
      this.player.setTexture(`${p}-player-${this.facing === 'side' ? 'side' : this.facing}`);
    }

    this.checkChest();
    this.checkDoor();
  }

  private createRoom(): void {
    const p = this.cabinConfig.assetPrefix;
    this.add.image(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, `${p}-base`)
      .setDisplaySize(ROOM_WIDTH, ROOM_HEIGHT)
      .setDepth(0);

    this.solids = this.physics.add.staticGroup();
    this.addWall(ROOM_WIDTH / 2, 92, ROOM_WIDTH, 184);
    this.addWall(67, ROOM_HEIGHT / 2, 134, ROOM_HEIGHT);
    this.addWall(ROOM_WIDTH - 67, ROOM_HEIGHT / 2, 134, ROOM_HEIGHT);
    this.addWall(250, ROOM_HEIGHT - 38, 500, 76);
    this.addWall(710, ROOM_HEIGHT - 38, 500, 76);
  }

  private createFurniture(): void {
    const p = this.cabinConfig.assetPrefix;

    if (this.cabinConfig.sceneKey === 'CabinOneScene') {
      this.addFurniture(210, 205, `${p}-bed-left`, 170, 112, 130, 42);
      this.addFurniture(320, 212, `${p}-bedside-left`, 74, 78, 52, 34);
      this.addFurniture(740, 195, `${p}-bookshelf`, 118, 112, 92, 38);
      this.add.image(480, 345, `${p}-rug-small`).setDisplaySize(150, 105).setDepth(2);
      this.addFurniture(770, 355, `${p}-plant-right`, 66, 76, 42, 26);
      this.createChest(520, 205);
      return;
    }

    if (this.cabinConfig.sceneKey === 'CabinTwoScene') {
      this.addFurniture(480, 188, `${p}-fireplace`, 132, 98, 100, 34);
      this.addFurniture(690, 290, `${p}-table-main`, 150, 92, 116, 36);
      this.addFurniture(610, 345, `${p}-chair-left`, 64, 86, 38, 28);
      this.addFurniture(770, 345, `${p}-chair-right`, 64, 86, 38, 28);
      this.addFurniture(220, 300, `${p}-barrel-right`, 82, 98, 56, 42);
      this.add.image(420, 345, `${p}-rug-small`).setDisplaySize(150, 105).setDepth(2);
      this.createChest(330, 215);
      return;
    }

    this.addFurniture(220, 205, `${p}-bed-left`, 170, 112, 130, 42);
    this.addFurniture(740, 205, `${p}-bed-right`, 170, 112, 130, 42);
    this.addFurniture(745, 350, `${p}-crate-closed`, 82, 78, 58, 30);
    this.addFurniture(220, 355, `${p}-plant-left`, 66, 76, 42, 26);
    this.add.image(480, 340, `${p}-rug-small`).setDisplaySize(160, 112).setDepth(2);
    this.createChest(480, 205);
  }

  private createChest(x: number, y: number): void {
    const p = this.cabinConfig.assetPrefix;
    this.chest = this.physics.add.staticImage(
      x,
      y,
      this.chestOpened ? `${p}-chest-open` : `${p}-chest-closed`
    );
    this.chest.setDisplaySize(76, 62).setDepth(10).refreshBody();
    (this.chest.body as Phaser.Physics.Arcade.StaticBody).setSize(58, 34).setOffset(9, 25);
    this.solids.add(this.chest);
  }

  private addFurniture(x: number, y: number, key: string, width: number, height: number, bodyWidth: number, bodyHeight: number): Phaser.Physics.Arcade.Image {
    const item = this.physics.add.staticImage(x, y, key).setDisplaySize(width, height).setDepth(8);
    item.refreshBody();
    (item.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(bodyWidth, bodyHeight)
      .setOffset((width - bodyWidth) / 2, height - bodyHeight);
    this.solids.add(item);
    return item;
  }

  private addWall(x: number, y: number, width: number, height: number): void {
    const wall = this.add.rectangle(x, y, width, height, 0x000000, 0);
    this.physics.add.existing(wall, true);
    this.solids.add(wall);
  }

  private checkChest(): void {
    const isNearChest = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.chest.x, this.chest.y) <= 82;

    if (!isNearChest) {
      this.chestInRange = false;
      return;
    }

    if (this.messageOpen || this.chestInRange) return;
    this.chestInRange = true;

    if (!this.chestOpened) {
      const p = this.cabinConfig.assetPrefix;
      this.chestOpened = true;
      this.chest.setTexture(`${p}-chest-open`);
      markTrainingChestRead(this.cabinConfig.chestId);
    }

    this.showMessage(this.cabinConfig.chestMessage);
  }

  private showMessage(message: string): void {
    this.messageOpen = true;
    const view = this.cameras.main.worldView;
    const boxY = Math.min(view.centerY + 105, view.bottom - 100);
    const box = this.add.rectangle(view.centerX, boxY, 640, 150, 0x17100c, 0.96)
      .setStrokeStyle(4, 0xd6a84b, 1)
      .setDepth(100)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(view.centerX, boxY - 13, message, {
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: '22px',
      color: '#fff0c7',
      align: 'center',
      wordWrap: { width: 590 }
    }).setOrigin(0.5).setDepth(101);
    const close = this.add.text(view.centerX, boxY + 48, 'Toca, ESPACIO o ENTER para continuar', {
      fontFamily: 'Arial', fontSize: '15px', color: '#d6a84b'
    }).setOrigin(0.5).setDepth(101);

    const dismiss = (): void => {
      if (!box.active) return;
      box.destroy();
      text.destroy();
      close.destroy();
      this.messageOpen = false;
    };
    box.once('pointerdown', dismiss);
    this.input.keyboard?.once('keydown-SPACE', dismiss);
    this.input.keyboard?.once('keydown-ENTER', dismiss);
  }

  private checkDoor(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.player.y < ROOM_HEIGHT - 42 || Math.abs(this.player.x - ROOM_WIDTH / 2) > 58 || body.velocity.y <= 0) return;
    this.exitCabin();
  }

  private exitCabin(): void {
    if (this.exiting) return;
    this.exiting = true;
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
    this.cameras.main.fadeOut(260, 20, 12, 8);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const training = this.scene.get('TrainingScene') as unknown as {
        player?: Phaser.Physics.Arcade.Sprite;
        cameras: Phaser.Cameras.Scene2D.CameraManager;
        __cabinTransitioning?: boolean;
        __cabin1Transitioning?: boolean;
      };
      training.player?.setPosition(this.cabinConfig.returnX, TRAINING_RETURN_Y);
      training.__cabinTransitioning = false;
      training.__cabin1Transitioning = false;
      this.scene.wake('TrainingScene');
      training.cameras.main.fadeIn(260, 18, 12, 8);
      this.scene.stop();
    });
  }

  private createPlayerAnimations(): void {
    const p = this.cabinConfig.assetPrefix;
    const make = (key: string, frames: string[], frameRate: number): void => {
      if (this.anims.exists(key)) this.anims.remove(key);
      this.anims.create({ key, frames: frames.map((textureKey) => ({ key: textureKey })), frameRate, repeat: -1 });
    };
    make(`${p}-walk-down`, [`${p}-player-down1`, `${p}-player-down2`], 6);
    make(`${p}-walk-side`, [`${p}-player-side1`, `${p}-player-side`, `${p}-player-side2`, `${p}-player-side`], 8);
    make(`${p}-walk-up`, [`${p}-player-up1`, `${p}-player-up2`], 6);
  }

  private createTouchControls(): void {
    const centerX = 112;
    const centerY = ROOM_HEIGHT - 108;
    const spacing = 56;
    const createButton = (x: number, y: number, label: string, direction: TouchDirection): void => {
      const button = this.add.circle(x, y, 34, 0x17100c, 0.72)
        .setStrokeStyle(4, 0xd6a84b, 0.9)
        .setDepth(200)
        .setInteractive({ useHandCursor: true });
      this.add.text(x, y, label, { fontFamily: 'Arial', fontSize: '28px', color: '#fff0c7' })
        .setOrigin(0.5).setDepth(201);
      const down = (): void => { this.touchDirections[direction] = true; };
      const up = (): void => { this.touchDirections[direction] = false; };
      button.on('pointerdown', down);
      button.on('pointerup', up);
      button.on('pointerout', up);
      button.on('pointerupoutside', up);
    };
    createButton(centerX - spacing, centerY, '◀', 'left');
    createButton(centerX + spacing, centerY, '▶', 'right');
    createButton(centerX, centerY - spacing, '▲', 'up');
    createButton(centerX, centerY + spacing, '▼', 'down');
  }
}

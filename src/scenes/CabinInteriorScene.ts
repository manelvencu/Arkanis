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
const DOOR_X = ROOM_WIDTH / 2;
const DOOR_HALF_WIDTH = 72;
const EXIT_Y = 500;
const INTERIOR_GRID_COLUMNS = 30;
const INTERIOR_GRID_ROWS = 15;
const INTERIOR_CELL_WIDTH = ROOM_WIDTH / INTERIOR_GRID_COLUMNS;
const INTERIOR_CELL_HEIGHT = ROOM_HEIGHT / INTERIOR_GRID_ROWS;

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
  private chest!: Phaser.Physics.Arcade.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private facing: Facing = 'up';
  private messageOpen = false;
  private chestOpened = false;
  private chestInRange = false;
  private exiting = false;
  private interiorBlockers?: Phaser.Physics.Arcade.StaticGroup;
  private touchDirections: Record<TouchDirection, boolean> = { left: false, right: false, up: false, down: false };

  protected constructor(config: CabinInteriorConfig) {
    super(config.sceneKey);
    this.cabinConfig = config;
  }

  init(data: CabinInteriorData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.messageOpen = false;
    this.chestInRange = false;
    this.exiting = false;
    this.facing = 'up';
    this.interiorBlockers = undefined;
    this.touchDirections = { left: false, right: false, up: false, down: false };
    this.chestOpened = getTrainingProgress().readChestIds.includes(this.cabinConfig.chestId);
  }

  preload(): void {
    const p = this.cabinConfig.assetPrefix;
    const background = this.cabinConfig.sceneKey === 'CabinTwoScene'
      ? 'cabin-interior-furnished-02.png'
      : 'cabin-interior-furnished-01.png';

    this.load.image(`${p}-interior`, `${CABIN_ASSET_ROOT}${background}`);
    this.load.image(`${p}-chest-closed`, './assets/environment/chest-closed-01.png');
    this.load.image(`${p}-chest-open`, './assets/environment/chest-open-01.png');

    const assets = CHARACTER_ASSETS[this.characterId === 'lupe' ? 'lupe' : 'tiana'];
    Object.entries(assets).forEach(([key, path]) => this.load.image(`${p}-player-${key}`, path));
  }

  create(): void {
    const p = this.cabinConfig.assetPrefix;
    this.physics.world.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBackgroundColor('#17100c');
    this.cameras.main.setZoom(2);
    this.cameras.main.centerOn(ROOM_WIDTH / 2, ROOM_HEIGHT / 2);

    this.add.image(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, `${p}-interior`)
      .setDisplaySize(ROOM_WIDTH, ROOM_HEIGHT)
      .setDepth(0);

    this.createPlayerAnimations();
    this.createChest();

    this.player = this.physics.add.sprite(DOOR_X, 454, `${p}-player-up`);
    this.player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE).setDepth(30).setCollideWorldBounds(true);
    // El cuerpo físico está concentrado en la parte baja del sprite para que las
    // colisiones del grid respondan principalmente a los pies del personaje.
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(30, 20).setOffset(19, 46);

    this.createInteriorCollisions();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.createTouchControls();
    this.cameras.main.fadeIn(220, 18, 12, 8);
  }

  update(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);
    if (this.exiting || this.messageOpen) return;

    let x = 0;
    let y = 0;
    if (this.cursors.left.isDown || this.touchDirections.left) x -= 1;
    if (this.cursors.right.isDown || this.touchDirections.right) x += 1;
    if (this.cursors.up.isDown || this.touchDirections.up) y -= 1;
    if (this.cursors.down.isDown || this.touchDirections.down) y += 1;

    if (x !== 0 || y !== 0) {
      const movement = new Phaser.Math.Vector2(x, y).normalize();
      body.setVelocity(movement.x * PLAYER_SPEED, movement.y * PLAYER_SPEED);
      this.setFacingFromMovement(movement);
      this.player.anims.play(`${this.cabinConfig.assetPrefix}-walk-${this.facing}`, true);
    } else {
      this.player.anims.stop();
      this.player.setTexture(`${this.cabinConfig.assetPrefix}-player-${this.facing === 'side' ? 'side' : this.facing}`);
    }

    this.checkChest();
    this.checkDoor();
  }

  private setFacingFromMovement(movement: Phaser.Math.Vector2): void {
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
  }

  private createInteriorCollisions(): void {
    if (this.cabinConfig.sceneKey !== 'CabinOneScene') return;

    this.interiorBlockers = this.physics.add.staticGroup();

    // Rango inclusivo de celdas C/F, usando exactamente el grid visible 30x15.
    const blockRange = (c1: number, f1: number, c2: number, f2: number): void => {
      const left = (c1 - 1) * INTERIOR_CELL_WIDTH;
      const top = (f1 - 1) * INTERIOR_CELL_HEIGHT;
      const width = (c2 - c1 + 1) * INTERIOR_CELL_WIDTH;
      const height = (f2 - f1 + 1) * INTERIOR_CELL_HEIGHT;
      const blocker = this.add.rectangle(left + width / 2, top + height / 2, width, height, 0x000000, 0);
      this.physics.add.existing(blocker, true);
      this.interiorBlockers!.add(blocker);
    };

    // Pared superior: F1-F5 completas.
    blockRange(1, 1, 30, 5);

    // Laterales: C1-C4 y C27-C30.
    blockRange(1, 6, 4, 12);
    blockRange(27, 6, 30, 12);

    // Zona inferior: F13-F15 bloqueadas, dejando libre el pasillo C14-C17.
    blockRange(1, 13, 13, 15);
    blockRange(18, 13, 30, 15);

    // Cama.
    blockRange(5, 6, 8, 8);

    // Mesa y sillas de la derecha.
    blockRange(24, 7, 27, 10);

    this.physics.add.collider(this.player, this.interiorBlockers);
  }

  private createChest(): void {
    const p = this.cabinConfig.assetPrefix;
    const positions: Record<string, Phaser.Math.Vector2> = {
      // C20/F5, centro exacto de la celda del grid 30x15.
      CabinOneScene: new Phaser.Math.Vector2(
        (20 - 0.5) * INTERIOR_CELL_WIDTH,
        (5 - 0.5) * INTERIOR_CELL_HEIGHT
      ),
      CabinTwoScene: new Phaser.Math.Vector2(300, 315),
      CabinThreeScene: new Phaser.Math.Vector2(650, 320)
    };
    const pos = positions[this.cabinConfig.sceneKey] ?? new Phaser.Math.Vector2(650, 320);

    this.chest = this.physics.add.staticImage(pos.x, pos.y, this.chestOpened ? `${p}-chest-open` : `${p}-chest-closed`)
      .setDisplaySize(70, 58)
      .setDepth(12);
    this.chest.refreshBody();
  }

  private checkChest(): void {
    const isNear = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.chest.x, this.chest.y) <= 78;
    if (!isNear) {
      this.chestInRange = false;
      return;
    }
    if (this.chestInRange || this.messageOpen) return;
    this.chestInRange = true;

    if (!this.chestOpened) {
      this.chestOpened = true;
      this.chest.setTexture(`${this.cabinConfig.assetPrefix}-chest-open`);
      markTrainingChestRead(this.cabinConfig.chestId);
    }
    this.showMessage(this.cabinConfig.chestMessage);
  }

  private showMessage(message: string): void {
    this.messageOpen = true;
    const view = this.cameras.main.worldView;
    const boxY = Math.min(view.centerY + 105, view.bottom - 92);
    const box = this.add.rectangle(view.centerX, boxY, 640, 142, 0x17100c, 0.96)
      .setStrokeStyle(4, 0xd6a84b, 1).setDepth(100).setInteractive({ useHandCursor: true });
    const text = this.add.text(view.centerX, boxY - 12, message, {
      fontFamily: 'Georgia, Times New Roman, serif', fontSize: '22px', color: '#fff0c7',
      align: 'center', wordWrap: { width: 590 }
    }).setOrigin(0.5).setDepth(101);
    const close = this.add.text(view.centerX, boxY + 46, 'Toca, ESPACIO o ENTER para continuar', {
      fontFamily: 'Arial', fontSize: '15px', color: '#d6a84b'
    }).setOrigin(0.5).setDepth(101);

    const dismiss = (): void => {
      if (!box.active) return;
      box.destroy(); text.destroy(); close.destroy();
      this.messageOpen = false;
    };
    box.once('pointerdown', dismiss);
    this.input.keyboard?.once('keydown-SPACE', dismiss);
    this.input.keyboard?.once('keydown-ENTER', dismiss);
  }

  private checkDoor(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y <= 0) return;
    if (Math.abs(this.player.x - DOOR_X) > DOOR_HALF_WIDTH) return;
    if (this.player.y < EXIT_Y) return;
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
    make(`${p}-walk-up`, [`${p}-player-up1`, `${p}-player-up2`], 6);
    make(`${p}-walk-side`, [`${p}-player-side1`, `${p}-player-side`, `${p}-player-side2`, `${p}-player-side`], 8);
  }

  private createTouchControls(): void {
    const centerX = 112;
    const centerY = ROOM_HEIGHT - 108;
    const spacing = 56;
    const createButton = (x: number, y: number, label: string, direction: TouchDirection): void => {
      const button = this.add.circle(x, y, 34, 0x17100c, 0.72)
        .setStrokeStyle(4, 0xd6a84b, 0.9).setDepth(200).setInteractive({ useHandCursor: true });
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

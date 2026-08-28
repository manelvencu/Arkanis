import * as Phaser from 'phaser';
import type { CharacterId } from '../gameData';
import { getTrainingProgress, markTrainingChestRead } from '../trainingProgress';

interface CabinOneData {
  characterId: CharacterId;
}

type Facing = 'down' | 'up' | 'side';
type TouchDirection = 'left' | 'right' | 'up' | 'down';

const ROOM_WIDTH = 384;
const ROOM_HEIGHT = 320;
const WALL = 24;
const PLAYER_SIZE = 64;
const CHEST_ID = 'training-cabin-1';
const CHEST_MESSAGE = 'En las tierras de Arkanis deberás ir pasando retos a los que debes enfrentarte sin miedo, para ello podrás disparar rayos, hechizos, podrás moverte, saltar y empujar objetos. Que tengas suerte!';

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

export class CabinOneScene extends Phaser.Scene {
  private characterId: CharacterId = 'tiana';
  private player!: Phaser.Physics.Arcade.Sprite;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private chest!: Phaser.Physics.Arcade.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private facing: Facing = 'up';
  private messageOpen = false;
  private chestOpened = false;
  private exiting = false;
  private touchDirections: Record<TouchDirection, boolean> = {
    left: false,
    right: false,
    up: false,
    down: false
  };

  constructor() {
    super('CabinOneScene');
  }

  init(data: CabinOneData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.messageOpen = false;
    this.exiting = false;
    this.chestOpened = getTrainingProgress().readChestIds.includes(CHEST_ID);
  }

  preload(): void {
    this.load.image('cabin1-bed', './assets/environment/interiors/cabin/bed-single-01.png');
    this.load.image('cabin1-table', './assets/environment/interiors/cabin/table-main-01.png');
    this.load.image('cabin1-chest-closed', './assets/environment/chest-closed-01.png');
    this.load.image('cabin1-chest-open', './assets/environment/chest-open-01.png');

    const assets = CHARACTER_ASSETS[this.characterId === 'lupe' ? 'lupe' : 'tiana'];
    Object.entries(assets).forEach(([key, path]) => this.load.image(`cabin1-player-${key}`, path));
  }

  create(): void {
    this.physics.world.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBackgroundColor('#17100c');
    this.cameras.main.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setZoom(1.55);
    this.cameras.main.centerOn(ROOM_WIDTH / 2, ROOM_HEIGHT / 2);

    this.createRoom();
    this.createFurniture();
    this.createPlayerAnimations();

    this.player = this.physics.add.sprite(ROOM_WIDTH / 2, ROOM_HEIGHT - 62, 'cabin1-player-up');
    this.player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE).setDepth(20).setCollideWorldBounds(true);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(28, 24).setOffset(18, 36);

    this.physics.add.collider(this.player, this.solids);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.createTouchControls();

    this.add.text(ROOM_WIDTH / 2, 46, 'Cabaña', {
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: '15px',
      color: '#f4d58b',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(50);
  }

  update(): void {
    if (this.exiting || this.messageOpen) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
      return;
    }

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
      body.setVelocity(movement.x * 120, movement.y * 120);

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
      this.player.anims.play(`cabin1-walk-${this.facing}`, true);
    } else {
      this.player.anims.stop();
      this.player.setTexture(`cabin1-player-${this.facing === 'side' ? 'side' : this.facing}`);
    }

    this.checkChest();
    this.checkDoor();
  }

  private createRoom(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x6f492d, 1);
    graphics.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

    for (let y = WALL; y < ROOM_HEIGHT - WALL; y += 24) {
      graphics.lineStyle(1, 0x855b39, 0.55);
      graphics.lineBetween(WALL, y, ROOM_WIDTH - WALL, y);
    }
    for (let x = WALL + 18; x < ROOM_WIDTH - WALL; x += 48) {
      graphics.lineStyle(1, 0x5b3924, 0.28);
      graphics.lineBetween(x, WALL, x, ROOM_HEIGHT - WALL);
    }

    graphics.fillStyle(0x3f2a20, 1);
    graphics.fillRect(0, 0, ROOM_WIDTH, WALL);
    graphics.fillRect(0, 0, WALL, ROOM_HEIGHT);
    graphics.fillRect(ROOM_WIDTH - WALL, 0, WALL, ROOM_HEIGHT);
    graphics.fillRect(0, ROOM_HEIGHT - WALL, ROOM_WIDTH / 2 - 34, WALL);
    graphics.fillRect(ROOM_WIDTH / 2 + 34, ROOM_HEIGHT - WALL, ROOM_WIDTH / 2 - 34, WALL);

    graphics.lineStyle(4, 0x271915, 1);
    graphics.strokeRect(2, 2, ROOM_WIDTH - 4, ROOM_HEIGHT - 4);

    this.solids = this.physics.add.staticGroup();
    this.addWall(ROOM_WIDTH / 2, WALL / 2, ROOM_WIDTH, WALL);
    this.addWall(WALL / 2, ROOM_HEIGHT / 2, WALL, ROOM_HEIGHT);
    this.addWall(ROOM_WIDTH - WALL / 2, ROOM_HEIGHT / 2, WALL, ROOM_HEIGHT);
    this.addWall((ROOM_WIDTH / 2 - 34) / 2, ROOM_HEIGHT - WALL / 2, ROOM_WIDTH / 2 - 34, WALL);
    this.addWall(ROOM_WIDTH - (ROOM_WIDTH / 2 - 34) / 2, ROOM_HEIGHT - WALL / 2, ROOM_WIDTH / 2 - 34, WALL);

    this.add.rectangle(ROOM_WIDTH / 2, ROOM_HEIGHT - 10, 64, 20, 0x2a1710).setDepth(2);
  }

  private createFurniture(): void {
    this.addFurniture(76, 82, 'cabin1-bed', 100, 88, 76, 48);
    this.addFurniture(310, 82, 'cabin1-table', 92, 82, 72, 44);

    this.chest = this.physics.add.staticImage(
      ROOM_WIDTH / 2,
      67,
      this.chestOpened ? 'cabin1-chest-open' : 'cabin1-chest-closed'
    );
    this.chest.setDisplaySize(74, 60).setDepth(8).refreshBody();
    (this.chest.body as Phaser.Physics.Arcade.StaticBody).setSize(56, 36).setOffset(9, 18);
    this.solids.add(this.chest);
  }

  private addFurniture(x: number, y: number, key: string, width: number, height: number, bodyWidth: number, bodyHeight: number): void {
    const item = this.physics.add.staticImage(x, y, key).setDisplaySize(width, height).setDepth(8);
    item.refreshBody();
    (item.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(bodyWidth, bodyHeight)
      .setOffset((width - bodyWidth) / 2, height - bodyHeight);
    this.solids.add(item);
  }

  private addWall(x: number, y: number, width: number, height: number): void {
    const wall = this.add.rectangle(x, y, width, height, 0x000000, 0);
    this.physics.add.existing(wall, true);
    this.solids.add(wall);
  }

  private checkChest(): void {
    if (this.messageOpen || this.chestOpened) return;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.chest.x, this.chest.y) > 72) return;

    this.chestOpened = true;
    this.chest.setTexture('cabin1-chest-open');
    markTrainingChestRead(CHEST_ID);
    this.showMessage(CHEST_MESSAGE);
  }

  private showMessage(message: string): void {
    this.messageOpen = true;
    const box = this.add.rectangle(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 + 38, 330, 132, 0x17100c, 0.96)
      .setStrokeStyle(3, 0xd6a84b, 1)
      .setDepth(100)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 + 28, message, {
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: '11px',
      color: '#fff0c7',
      align: 'center',
      wordWrap: { width: 300 }
    }).setOrigin(0.5).setDepth(101);
    const close = this.add.text(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 + 91, 'Toca para continuar', {
      fontFamily: 'Arial', fontSize: '9px', color: '#d6a84b'
    }).setOrigin(0.5).setDepth(101);

    const dismiss = (): void => {
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
    if (this.player.y < ROOM_HEIGHT - 44 || Math.abs(this.player.x - ROOM_WIDTH / 2) > 34 || body.velocity.y <= 0) return;
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
        __cabin1Transitioning?: boolean;
      };
      training.player?.setPosition(370, 390);
      training.__cabin1Transitioning = false;
      this.scene.wake('TrainingScene');
      this.scene.stop();
    });
  }

  private createPlayerAnimations(): void {
    const make = (key: string, frames: string[]): void => {
      if (this.anims.exists(key)) return;
      this.anims.create({ key, frames: frames.map((textureKey) => ({ key: textureKey })), frameRate: 7, repeat: -1 });
    };
    make('cabin1-walk-down', ['cabin1-player-down1', 'cabin1-player-down2']);
    make('cabin1-walk-side', ['cabin1-player-side1', 'cabin1-player-side2']);
    make('cabin1-walk-up', ['cabin1-player-up1', 'cabin1-player-up2']);
  }

  private createTouchControls(): void {
    const centerX = 68;
    const centerY = ROOM_HEIGHT - 70;
    const spacing = 34;
    const createButton = (x: number, y: number, label: string, direction: TouchDirection): void => {
      const button = this.add.circle(x, y, 18, 0x17100c, 0.72)
        .setStrokeStyle(2, 0xd6a84b, 0.9)
        .setDepth(200)
        .setInteractive({ useHandCursor: true });
      this.add.text(x, y, label, { fontFamily: 'Arial', fontSize: '14px', color: '#fff0c7' })
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

import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';
import { createPlayableUi, preloadPlayableUiAssets, type PlayableUiController } from '../playableSceneUi';
import { getVillageProgress } from '../villageProgress';

type Facing = 'down' | 'up' | 'side';
type AnimatedCharacter = 'tiana' | 'lupe';

interface ChurchInteriorData {
  characterId?: CharacterId;
  returnX?: number;
  returnY?: number;
}

const ROOM_WIDTH = 960;
const ROOM_HEIGHT = 540;
const PLAYER_SIZE = 68;
const PLAYER_SPEED = 150;
const ENTRANCE_X = ROOM_WIDTH / 2;
const ENTRANCE_Y = ROOM_HEIGHT - 58;
const EXIT_HALF_WIDTH = 62;

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

export class ChurchInteriorScene extends Phaser.Scene {
  private characterId: CharacterId = 'tiana';
  private animatedCharacter: AnimatedCharacter = 'tiana';
  private returnX = 592;
  private returnY = 266;
  private player!: Phaser.Physics.Arcade.Sprite;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private ui!: PlayableUiController;
  private facing: Facing = 'up';
  private exiting = false;

  constructor() {
    super('ChurchInteriorScene');
  }

  init(data: ChurchInteriorData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.animatedCharacter = this.characterId === 'lupe' ? 'lupe' : 'tiana';
    this.returnX = data.returnX ?? 592;
    this.returnY = data.returnY ?? 266;
    this.facing = 'up';
    this.exiting = false;
  }

  preload(): void {
    preloadPlayableUiAssets(this);
    const base = './assets/environment/interiors/church/';
    this.load.image('church-interior-base', `${base}church-interior-base-01.png`);
    this.load.image('church-altar-main', `${base}church-altar-main-01.png`);
    this.load.image('church-bench-01', `${base}church-bench-01.png`);
    this.load.image('church-carpet-straight', `${base}church-red-carpet-straight-01.png`);
    this.load.image('church-candelabra', `${base}church-candelabra-01.png`);
    this.load.image('church-donation-chest', `${base}church-donation-chest-01.png`);
    this.load.image('church-priest', './assets/characters/npcs/npc-priest-idle-down-01.png');

    Object.entries(CHARACTER_ASSETS[this.animatedCharacter]).forEach(([key, path]) => {
      this.load.image(`church-player-${this.animatedCharacter}-${key}`, path);
    });
  }

  create(): void {
    this.physics.world.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBackgroundColor('#080706');
    this.cameras.main.setZoom(2);
    this.cameras.main.centerOn(ROOM_WIDTH / 2, ROOM_HEIGHT / 2);

    this.add.image(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 'church-interior-base')
      .setDisplaySize(ROOM_WIDTH, ROOM_HEIGHT)
      .setDepth(0);

    this.createRoomCollisions();
    this.createChurchFurnishings();
    this.createPlayerAnimations();

    this.player = this.physics.add.sprite(
      ENTRANCE_X,
      ENTRANCE_Y,
      `church-player-${this.animatedCharacter}-up`
    );
    this.player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE).setDepth(30).setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(30, 28).setOffset(19, 38);
    this.physics.add.collider(this.player, this.solids);

    this.cursors = this.input.keyboard!.createCursorKeys();

    const characterData = characters.find((item) => item.id === this.characterId) ?? characters[0];
    const progress = getVillageProgress();
    this.ui = createPlayableUi(this, this.characterId, characterData.name, progress.energy, progress.coins);

    this.cameras.main.fadeIn(260, 18, 12, 8);
  }

  update(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);
    if (this.exiting) return;

    let x = 0;
    let y = 0;
    if (this.cursors.left.isDown || this.ui.touchDirections.left) x -= 1;
    if (this.cursors.right.isDown || this.ui.touchDirections.right) x += 1;
    if (this.cursors.up.isDown || this.ui.touchDirections.up) y -= 1;
    if (this.cursors.down.isDown || this.ui.touchDirections.down) y += 1;

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

      this.player.anims.play(`church-player-${this.animatedCharacter}-walk-${this.facing}`, true);
    } else {
      this.player.anims.stop();
      this.player.setTexture(
        `church-player-${this.animatedCharacter}-${this.facing === 'side' ? 'side' : this.facing}`
      );
    }

    this.checkExit();
  }

  private createChurchFurnishings(): void {
    // Usamos exclusivamente el tramo central de alfombra y lo giramos 90 grados.
    // Se repite de forma limpia desde la entrada hasta delante del sacerdote.
    [446, 366, 286].forEach((y) => {
      this.add.image(ENTRANCE_X, y, 'church-carpet-straight')
        .setDisplaySize(96, 82)
        .setRotation(Math.PI / 2)
        .setDepth(1.5);
    });

    // Cuatro bancos iguales, algo más pequeños y simétricos para que el conjunto sea más coherente.
    this.addSolidImage(330, 342, 'church-bench-01', 178, 56, 158, 30, 8);
    this.addSolidImage(630, 342, 'church-bench-01', 178, 56, 158, 30, 8);
    this.addSolidImage(330, 423, 'church-bench-01', 178, 56, 158, 30, 8);
    this.addSolidImage(630, 423, 'church-bench-01', 178, 56, 158, 30, 8);

    // Altar central sobre la plataforma de piedra de la imagen base.
    this.addSolidImage(480, 132, 'church-altar-main', 150, 92, 118, 44, 12);

    // Dos puntos de luz junto al altar.
    this.add.image(370, 158, 'church-candelabra').setDisplaySize(44, 62).setDepth(11);
    this.add.image(590, 158, 'church-candelabra').setDisplaySize(44, 62).setDepth(11);

    // Sacerdote estático delante del altar, mirando hacia el personaje.
    this.addSolidImage(480, 222, 'church-priest', 72, 86, 34, 24, 20);

    // Un único detalle cerca de la entrada para evitar llenar demasiado el espacio.
    this.addSolidImage(105, 455, 'church-donation-chest', 72, 58, 58, 28, 9);
  }

  private addSolidImage(
    x: number,
    y: number,
    key: string,
    width: number,
    height: number,
    bodyWidth: number,
    bodyHeight: number,
    depth: number
  ): Phaser.Physics.Arcade.Image {
    const item = this.physics.add.staticImage(x, y, key)
      .setDisplaySize(width, height)
      .setDepth(depth);
    item.refreshBody();
    const body = item.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(bodyWidth, bodyHeight).setOffset((width - bodyWidth) / 2, height - bodyHeight);
    this.solids.add(item);
    return item;
  }

  private createRoomCollisions(): void {
    this.solids = this.physics.add.staticGroup();

    const addWall = (x: number, y: number, width: number, height: number): void => {
      const wall = this.add.rectangle(x, y, width, height, 0x000000, 0);
      this.physics.add.existing(wall, true);
      this.solids.add(wall);
    };

    // Pared superior y laterales de la estructura base.
    addWall(ROOM_WIDTH / 2, 38, ROOM_WIDTH, 76);
    addWall(18, ROOM_HEIGHT / 2, 36, ROOM_HEIGHT);
    addWall(ROOM_WIDTH - 18, ROOM_HEIGHT / 2, 36, ROOM_HEIGHT);

    // Pared inferior dejando libre el hueco central de la puerta.
    const sideWidth = ROOM_WIDTH / 2 - EXIT_HALF_WIDTH;
    addWall(sideWidth / 2, ROOM_HEIGHT - 17, sideWidth, 34);
    addWall(ROOM_WIDTH - sideWidth / 2, ROOM_HEIGHT - 17, sideWidth, 34);
  }

  private createPlayerAnimations(): void {
    const create = (direction: Facing, frames: string[], frameRate: number): void => {
      const key = `church-player-${this.animatedCharacter}-walk-${direction}`;
      if (this.anims.exists(key)) this.anims.remove(key);
      this.anims.create({
        key,
        frames: frames.map((frame) => ({ key: frame })),
        frameRate,
        repeat: -1
      });
    };

    create('down', [
      `church-player-${this.animatedCharacter}-down1`,
      `church-player-${this.animatedCharacter}-down2`
    ], 6);
    create('up', [
      `church-player-${this.animatedCharacter}-up1`,
      `church-player-${this.animatedCharacter}-up2`
    ], 6);
    create('side', [
      `church-player-${this.animatedCharacter}-side1`,
      `church-player-${this.animatedCharacter}-side`,
      `church-player-${this.animatedCharacter}-side2`,
      `church-player-${this.animatedCharacter}-side`
    ], 8);
  }

  private checkExit(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y <= 0) return;
    if (Math.abs(this.player.x - ENTRANCE_X) > EXIT_HALF_WIDTH) return;
    if (this.player.y < ROOM_HEIGHT - 44) return;
    this.exitChurch();
  }

  private exitChurch(): void {
    if (this.exiting) return;
    this.exiting = true;
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
    this.player.anims.stop();
    this.cameras.main.fadeOut(260, 18, 12, 8);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('AldeaScene', {
        characterId: this.characterId,
        returnX: this.returnX,
        returnY: this.returnY
      });
    });
  }
}

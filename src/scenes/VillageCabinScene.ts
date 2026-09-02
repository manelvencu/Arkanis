import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';
import { createPlayableUi, preloadPlayableUiAssets, type PlayableUiController } from '../playableSceneUi';
import { collectVillageCabinCoin, getVillageProgress, setVillageEnergy, type VillageCabinKind } from '../villageProgress';

interface VillageCabinData {
  characterId?: CharacterId;
  kind?: VillageCabinKind;
  returnX?: number;
  returnY?: number;
}

type Facing = 'down' | 'up' | 'side';
type CabinCoin = { index: number; sprite: Phaser.GameObjects.Image };

const ROOM_WIDTH = 960;
const ROOM_HEIGHT = 540;
const PLAYER_SIZE = 68;
const PLAYER_SPEED = 150;
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

export class VillageCabinScene extends Phaser.Scene {
  private characterId: CharacterId = 'tiana';
  private kind: VillageCabinKind = 'coins';
  private returnX = 480;
  private returnY = 480;
  private player!: Phaser.Physics.Arcade.Sprite;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private ui!: PlayableUiController;
  private facing: Facing = 'up';
  private exiting = false;
  private messageOpen = false;
  private barrel?: Phaser.Physics.Arcade.Image;
  private barrelTriggered = false;
  private coinEntries: CabinCoin[] = [];

  constructor() {
    super('VillageCabinScene');
  }

  init(data: VillageCabinData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.kind = data.kind ?? 'coins';
    this.returnX = data.returnX ?? 480;
    this.returnY = data.returnY ?? 480;
    this.facing = 'up';
    this.exiting = false;
    this.messageOpen = false;
    this.barrelTriggered = false;
    this.coinEntries = [];
  }

  preload(): void {
    preloadPlayableUiAssets(this);
    const loadCabin = (key: string, filename: string): void => this.load.image(key, `${CABIN_ASSET_ROOT}${filename}`);
    loadCabin('village-cabin-base', 'cabin-interior-base-01.png');
    loadCabin('village-cabin-bed-left', 'cabin-bed-left-01.png');
    loadCabin('village-cabin-bed-right', 'cabin-bed-right-01.png');
    loadCabin('village-cabin-bedside-left', 'cabin-bedside-table-left-01.png');
    loadCabin('village-cabin-table-main', 'cabin-table-main-01.png');
    loadCabin('village-cabin-chair-left', 'cabin-chair-left-01.png');
    loadCabin('village-cabin-chair-right', 'cabin-chair-right-01.png');
    loadCabin('village-cabin-barrel-right', 'cabin-barrel-right-01.png');
    loadCabin('village-cabin-crate-closed', 'cabin-crate-closed-01.png');
    loadCabin('village-cabin-bookshelf', 'cabin-bookshelf-01.png');
    loadCabin('village-cabin-fireplace', 'cabin-fireplace-01.png');
    loadCabin('village-cabin-rug-small', 'cabin-rug-small-01.png');
    loadCabin('village-cabin-plant-left', 'cabin-plant-pot-left-01.png');
    loadCabin('village-cabin-plant-right', 'cabin-plant-pot-right-01.png');
    this.load.image('village-cabin-coin', './assets/environment/coin-gold-01.png');
    this.load.image('village-cabin-boy', './assets/characters/npcs/npc-boy-explorer-idle-down.png');
    this.load.image('village-cabin-girl', './assets/characters/npcs/npc-girl-braids-idle-down.png');

    const character = this.characterId === 'lupe' ? 'lupe' : 'tiana';
    Object.entries(CHARACTER_ASSETS[character]).forEach(([key, path]) => {
      this.load.image(`village-cabin-${character}-${key}`, path);
    });
  }

  create(): void {
    this.physics.world.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBackgroundColor('#17100c');
    this.cameras.main.setZoom(2);
    this.cameras.main.centerOn(ROOM_WIDTH / 2, ROOM_HEIGHT / 2);

    this.createRoom();
    this.createCabinFurnishings();
    this.createPlayerAnimations();

    const character = this.characterId === 'lupe' ? 'lupe' : 'tiana';
    this.player = this.physics.add.sprite(ROOM_WIDTH / 2, ROOM_HEIGHT - 76, `village-cabin-${character}-up`);
    this.player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE).setDepth(30).setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(30, 28).setOffset(19, 38);
    this.physics.add.collider(this.player, this.solids);

    this.createCabinContent();
    this.cursors = this.input.keyboard!.createCursorKeys();

    const characterData = characters.find((item) => item.id === this.characterId) ?? characters[0];
    const progress = getVillageProgress();
    this.ui = createPlayableUi(this, this.characterId, characterData.name, progress.energy, progress.coins);

    this.cameras.main.fadeIn(260, 20, 12, 8);

    if (this.kind === 'blessing') {
      this.time.delayedCall(500, () => {
        if (!this.exiting) this.showMessage('Te deseamos el mejor de los caminos y que la suerte te acompañe.');
      });
    }
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
      this.player.anims.play(`village-cabin-${this.characterId}-walk-${this.facing}`, true);
    } else {
      this.player.anims.stop();
      this.player.setTexture(`village-cabin-${this.characterId}-${this.facing === 'side' ? 'side' : this.facing}`);
    }

    if (this.kind === 'coins') this.checkCoinCollection();
    if (this.kind === 'wine') this.checkWineBarrel();
    this.checkExit();
  }

  private createRoom(): void {
    this.add.image(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 'village-cabin-base')
      .setDisplaySize(ROOM_WIDTH, ROOM_HEIGHT)
      .setDepth(0);

    this.solids = this.physics.add.staticGroup();
    const wall = (x: number, y: number, width: number, height: number): void => {
      const item = this.add.rectangle(x, y, width, height, 0x000000, 0);
      this.physics.add.existing(item, true);
      this.solids.add(item);
    };

    wall(ROOM_WIDTH / 2, 92, ROOM_WIDTH, 184);
    wall(67, ROOM_HEIGHT / 2, 134, ROOM_HEIGHT);
    wall(ROOM_WIDTH - 67, ROOM_HEIGHT / 2, 134, ROOM_HEIGHT);
    wall(250, ROOM_HEIGHT - 38, 500, 76);
    wall(710, ROOM_HEIGHT - 38, 500, 76);
  }

  private createCabinFurnishings(): void {
    if (this.kind === 'coins') {
      this.addFurniture(210, 205, 'village-cabin-bed-left', 170, 112, 130, 42);
      this.addFurniture(320, 212, 'village-cabin-bedside-left', 74, 78, 52, 34);
      this.addFurniture(740, 195, 'village-cabin-bookshelf', 118, 112, 92, 38);
      this.add.image(480, 345, 'village-cabin-rug-small').setDisplaySize(150, 105).setDepth(2);
      this.addFurniture(770, 355, 'village-cabin-plant-right', 66, 76, 42, 26);
      return;
    }

    if (this.kind === 'wine') {
      this.addFurniture(480, 188, 'village-cabin-fireplace', 132, 98, 100, 34);
      this.addFurniture(690, 295, 'village-cabin-table-main', 150, 92, 116, 36);
      this.addFurniture(610, 345, 'village-cabin-chair-left', 64, 86, 38, 28);
      this.addFurniture(770, 345, 'village-cabin-chair-right', 64, 86, 38, 28);
      this.add.image(345, 330, 'village-cabin-rug-small').setDisplaySize(140, 98).setDepth(2);
      this.addFurniture(215, 345, 'village-cabin-plant-left', 66, 76, 42, 26);
      return;
    }

    this.addFurniture(215, 205, 'village-cabin-bed-left', 170, 112, 130, 42);
    this.addFurniture(745, 205, 'village-cabin-bed-right', 170, 112, 130, 42);
    this.add.image(480, 335, 'village-cabin-rug-small').setDisplaySize(160, 112).setDepth(2);
    this.addFurniture(250, 355, 'village-cabin-plant-left', 66, 76, 42, 26);
    this.addFurniture(710, 355, 'village-cabin-plant-right', 66, 76, 42, 26);
  }

  private createCabinContent(): void {
    if (this.kind === 'coins') {
      const positions: Array<[number, number]> = [
        [390, 195], [480, 190], [570, 195], [650, 215], [430, 285],
        [530, 285], [365, 375], [480, 400], [595, 375], [690, 405]
      ];
      const progress = getVillageProgress();
      positions.forEach(([x, y], index) => {
        if (progress.collectedCabinCoins.includes(index)) return;
        const coin = this.add.image(x, y, 'village-cabin-coin').setDisplaySize(30, 30).setDepth(15);
        this.coinEntries.push({ index, sprite: coin });
        this.tweens.add({ targets: coin, y: y - 7, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      });
      return;
    }

    if (this.kind === 'wine') {
      this.barrel = this.physics.add.staticImage(310, 230, 'village-cabin-barrel-right').setDisplaySize(82, 98).setDepth(12);
      this.barrel.refreshBody();
      (this.barrel.body as Phaser.Physics.Arcade.StaticBody).setSize(56, 42).setOffset(13, 50);
      this.solids.add(this.barrel);
      this.add.image(385, 245, 'village-cabin-boy').setDisplaySize(68, 68).setDepth(13);
      return;
    }

    this.add.image(430, 245, 'village-cabin-boy').setDisplaySize(68, 68).setDepth(13);
    this.add.image(535, 245, 'village-cabin-girl').setDisplaySize(68, 68).setDepth(13);
  }

  private checkCoinCollection(): void {
    for (const entry of this.coinEntries.slice()) {
      if (!entry.sprite.active) continue;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, entry.sprite.x, entry.sprite.y) > 38) continue;
      if (!collectVillageCabinCoin(entry.index)) continue;

      this.tweens.killTweensOf(entry.sprite);
      entry.sprite.destroy();
      this.coinEntries = this.coinEntries.filter((coin) => coin !== entry);
      this.ui.updateCoins(getVillageProgress().coins);
    }
  }

  private addFurniture(x: number, y: number, key: string, width: number, height: number, bodyWidth: number, bodyHeight: number): Phaser.Physics.Arcade.Image {
    const item = this.physics.add.staticImage(x, y, key).setDisplaySize(width, height).setDepth(8);
    item.refreshBody();
    (item.body as Phaser.Physics.Arcade.StaticBody).setSize(bodyWidth, bodyHeight).setOffset((width - bodyWidth) / 2, height - bodyHeight);
    this.solids.add(item);
    return item;
  }

  private createPlayerAnimations(): void {
    const character = this.characterId === 'lupe' ? 'lupe' : 'tiana';
    const create = (direction: Facing, frames: string[], frameRate: number): void => {
      const key = `village-cabin-${character}-walk-${direction}`;
      if (this.anims.exists(key)) this.anims.remove(key);
      this.anims.create({ key, frames: frames.map((frame) => ({ key: frame })), frameRate, repeat: -1 });
    };

    create('down', [`village-cabin-${character}-down1`, `village-cabin-${character}-down2`], 6);
    create('up', [`village-cabin-${character}-up1`, `village-cabin-${character}-up2`], 6);
    create('side', [
      `village-cabin-${character}-side1`,
      `village-cabin-${character}-side`,
      `village-cabin-${character}-side2`,
      `village-cabin-${character}-side`
    ], 8);
  }

  private checkWineBarrel(): void {
    if (!this.barrel || this.barrelTriggered) return;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.barrel.x, this.barrel.y) > 105) return;

    this.barrelTriggered = true;
    const progress = getVillageProgress();
    if (progress.energy < 100) {
      setVillageEnergy(100);
      this.ui.updateEnergy(100);
      this.showEnergyRecoveryEffect();
    }
    this.showMessage('Toma de nuestro vino y retoma fuerzas para el camino');
  }

  private showEnergyRecoveryEffect(): void {
    const uiCamera = this.cameras.getCamera('VillageCabinSceneUICamera');
    const burst = this.add.circle(270, 210, 92, 0xffd65c, 0.18).setStrokeStyle(8, 0xffe98a, 0.95).setDepth(2000);
    const label = this.add.text(270, 210, 'ENERGÍA 100%', {
      fontFamily: 'Arial', fontSize: '34px', color: '#fff4b5', fontStyle: 'bold', stroke: '#5b3508', strokeThickness: 5
    }).setOrigin(0.5).setDepth(2001);
    this.cameras.main.ignore([burst, label]);
    if (!uiCamera) return;
    this.tweens.add({
      targets: [burst, label], scale: 1.22, alpha: 0, duration: 950, ease: 'Quad.easeOut',
      onComplete: () => { burst.destroy(); label.destroy(); }
    });
  }

  private showMessage(message: string): void {
    if (this.messageOpen) return;
    this.messageOpen = true;
    const view = this.cameras.main.worldView;
    const boxY = Math.min(view.centerY + 105, view.bottom - 100);
    const box = this.add.rectangle(view.centerX, boxY, 640, 150, 0x17100c, 0.97)
      .setStrokeStyle(4, 0xd6a84b, 1).setDepth(200);
    const text = this.add.text(view.centerX, boxY - 13, message, {
      fontFamily: 'Georgia, Times New Roman, serif', fontSize: '24px', color: '#fff0c7', align: 'center', wordWrap: { width: 590 }
    }).setOrigin(0.5).setDepth(201);
    const close = this.add.text(view.centerX, boxY + 45, 'Pulsa ESPACIO, ENTER o toca para continuar', {
      fontFamily: 'Arial', fontSize: '16px', color: '#d6a84b'
    }).setOrigin(0.5).setDepth(201);
    this.ui.ignoreWorldObject(box);
    this.ui.ignoreWorldObject(text);
    this.ui.ignoreWorldObject(close);

    const dismiss = (): void => {
      if (!box.active) return;
      box.destroy();
      text.destroy();
      close.destroy();
      this.messageOpen = false;
    };
    this.input.once('pointerdown', dismiss);
    this.input.keyboard?.once('keydown-SPACE', dismiss);
    this.input.keyboard?.once('keydown-ENTER', dismiss);
  }

  private checkExit(): void {
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
      this.scene.start('AldeaScene', {
        characterId: this.characterId,
        returnX: this.returnX,
        returnY: this.returnY
      });
    });
  }
}

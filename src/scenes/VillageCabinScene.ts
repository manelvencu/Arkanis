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
const DOOR_X = ROOM_WIDTH / 2;
const DOOR_HALF_WIDTH = 72;
const EXIT_Y = 500;
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
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private ui!: PlayableUiController;
  private facing: Facing = 'up';
  private exiting = false;
  private messageOpen = false;
  private wineTriggered = false;
  private coinEntries: CabinCoin[] = [];
  private wineNpc?: Phaser.GameObjects.Image;

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
    this.wineTriggered = false;
    this.coinEntries = [];
    this.wineNpc = undefined;
  }

  preload(): void {
    preloadPlayableUiAssets(this);
    this.load.image('village-cabin-home-01', `${CABIN_ASSET_ROOT}cabin-interior-furnished-01.png`);
    this.load.image('village-cabin-home-02', `${CABIN_ASSET_ROOT}cabin-interior-furnished-02.png`);
    this.load.image('village-cabin-wine', `${CABIN_ASSET_ROOT}cabin-interior-wine-shop-01.png`);
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

    const backgroundKey = this.kind === 'wine'
      ? 'village-cabin-wine'
      : this.kind === 'blessing' ? 'village-cabin-home-02' : 'village-cabin-home-01';
    this.add.image(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, backgroundKey)
      .setDisplaySize(ROOM_WIDTH, ROOM_HEIGHT)
      .setDepth(0);

    this.createPlayerAnimations();
    const character = this.characterId === 'lupe' ? 'lupe' : 'tiana';
    this.player = this.physics.add.sprite(DOOR_X, 454, `village-cabin-${character}-up`);
    this.player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE).setDepth(30).setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(30, 28).setOffset(19, 38);

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
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);
    if (this.exiting || this.messageOpen) return;

    let x = 0;
    let y = 0;
    if (this.cursors.left.isDown || this.ui.touchDirections.left) x -= 1;
    if (this.cursors.right.isDown || this.ui.touchDirections.right) x += 1;
    if (this.cursors.up.isDown || this.ui.touchDirections.up) y -= 1;
    if (this.cursors.down.isDown || this.ui.touchDirections.down) y += 1;

    if (x !== 0 || y !== 0) {
      const movement = new Phaser.Math.Vector2(x, y).normalize();
      body.setVelocity(movement.x * PLAYER_SPEED, movement.y * PLAYER_SPEED);
      this.setFacingFromMovement(movement);
      this.player.anims.play(`village-cabin-${this.characterId}-walk-${this.facing}`, true);
    } else {
      this.player.anims.stop();
      this.player.setTexture(`village-cabin-${this.characterId}-${this.facing === 'side' ? 'side' : this.facing}`);
    }

    if (this.kind === 'coins') this.checkCoinCollection();
    if (this.kind === 'wine') this.checkWineNpc();
    this.checkExit();
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

  private createCabinContent(): void {
    if (this.kind === 'coins') {
      const positions: Array<[number, number]> = [
        [390, 220], [480, 210], [570, 220], [400, 310], [500, 300],
        [600, 315], [350, 390], [460, 405], [570, 390], [675, 405]
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
      this.wineNpc = this.add.image(700, 250, 'village-cabin-boy').setDisplaySize(68, 68).setDepth(13);
      return;
    }

    this.add.image(410, 250, 'village-cabin-boy').setDisplaySize(68, 68).setDepth(13);
    this.add.image(535, 250, 'village-cabin-girl').setDisplaySize(68, 68).setDepth(13);
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

  private checkWineNpc(): void {
    if (!this.wineNpc || this.wineTriggered) return;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.wineNpc.x, this.wineNpc.y) > 92) return;
    this.wineTriggered = true;
    const progress = getVillageProgress();
    if (progress.energy < 100) {
      setVillageEnergy(100);
      this.ui.updateEnergy(100);
    }
    this.showMessage('Toma de nuestro vino y retoma fuerzas para el camino');
  }

  private showMessage(message: string): void {
    if (this.messageOpen) return;
    this.messageOpen = true;
    const view = this.cameras.main.worldView;
    const boxY = Math.min(view.centerY + 105, view.bottom - 92);
    const box = this.add.rectangle(view.centerX, boxY, 640, 142, 0x17100c, 0.97)
      .setStrokeStyle(4, 0xd6a84b, 1).setDepth(200);
    const text = this.add.text(view.centerX, boxY - 12, message, {
      fontFamily: 'Georgia, Times New Roman, serif', fontSize: '24px', color: '#fff0c7',
      align: 'center', wordWrap: { width: 590 }
    }).setOrigin(0.5).setDepth(201);
    const close = this.add.text(view.centerX, boxY + 45, 'Pulsa ESPACIO, ENTER o toca para continuar', {
      fontFamily: 'Arial', fontSize: '16px', color: '#d6a84b'
    }).setOrigin(0.5).setDepth(201);

    this.cameras.cameras.forEach((camera) => {
      if (camera === this.cameras.main) return;
      camera.ignore([box, text, close]);
    });

    const dismiss = (): void => {
      if (!box.active) return;
      box.destroy(); text.destroy(); close.destroy();
      this.messageOpen = false;
    };
    this.input.once('pointerdown', dismiss);
    this.input.keyboard?.once('keydown-SPACE', dismiss);
    this.input.keyboard?.once('keydown-ENTER', dismiss);
  }

  private checkExit(): void {
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
      this.scene.start('AldeaScene', {
        characterId: this.characterId,
        returnX: this.returnX,
        returnY: this.returnY
      });
    });
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
      `village-cabin-${character}-side1`, `village-cabin-${character}-side`,
      `village-cabin-${character}-side2`, `village-cabin-${character}-side`
    ], 8);
  }
}

import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';
import { createPlayableUi, preloadPlayableUiAssets, type PlayableUiController } from '../playableSceneUi';
import { getVillageProgress, grantFragmentHolderFromPriest } from '../villageProgress';
import { CHURCH_INTERIOR_COLLISION_MAP } from '../churchInteriorCollisionMap';
import {
  buildWalkableCellSet,
  moveOnInteriorGrid,
  type FootprintDefinition
} from '../interiorGridCollision';

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
const PLAYER_SPEED = 135;
const ENTRANCE_X = ROOM_WIDTH / 2;
const EXIT_HALF_WIDTH = 74;
const EXIT_Y = 500;
const PRIEST_X = ENTRANCE_X;
const PRIEST_Y = 190;
const PRIEST_REACH_X = 76;
const PRIEST_REACH_Y = 326;
const JEWEL_HOLDER_TEXTURE = 'church-arkanis-jewel-holder';

type PriestDialogueStage = 'none' | 'intro' | 'revealing' | 'reward' | 'repeat' | 'closing';

// Autoridad de suelo: centro entre los pies, igual que en las cabañas ya validadas.
const PLAYER_FOOTPRINT: FootprintDefinition = {
  width: 30,
  height: 18,
  offsetY: 25
};

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
  private returnX = 560;
  private returnY = 240;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private ui!: PlayableUiController;
  private facing: Facing = 'up';
  private exiting = false;
  private walkableCells: ReadonlySet<string> = new Set<string>();
  private priestHint?: Phaser.GameObjects.Text;
  private dialogueStage: PriestDialogueStage = 'none';
  private dialogueObjects: Phaser.GameObjects.GameObject[] = [];
  private revealReadyTimer?: Phaser.Time.TimerEvent;
  private lastDialogueActionAt = -1000;

  constructor() {
    super('ChurchInteriorScene');
  }

  init(data: ChurchInteriorData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.animatedCharacter = this.characterId === 'lupe' ? 'lupe' : 'tiana';
    this.returnX = data.returnX ?? 560;
    this.returnY = data.returnY ?? 240;
    this.facing = 'up';
    this.exiting = false;
    this.dialogueStage = 'none';
    this.dialogueObjects = [];
    this.revealReadyTimer = undefined;
    this.lastDialogueActionAt = -1000;
    this.walkableCells = buildWalkableCellSet(CHURCH_INTERIOR_COLLISION_MAP);
  }

  preload(): void {
    preloadPlayableUiAssets(this);
    this.load.image('church-interior-furnished', './assets/environment/interiors/church/church-interior-furnished-01.png');
    this.load.image('church-priest', './assets/characters/npcs/npc-priest-idle-down-01.png');
    this.load.image(JEWEL_HOLDER_TEXTURE, './assets/story/contenedor-joya-arkanis.png');
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

    this.add.image(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 'church-interior-furnished')
      .setDisplaySize(ROOM_WIDTH, ROOM_HEIGHT)
      .setDepth(0);

    // El sacerdote sigue siendo un NPC independiente porque después entregará un objeto.
    this.add.image(PRIEST_X, PRIEST_Y, 'church-priest').setDisplaySize(72, 86).setDepth(20);

    this.createPlayerAnimations();
    this.player = this.physics.add.sprite(
      ENTRANCE_X,
      454,
      `church-player-${this.animatedCharacter}-up`
    );
    this.player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE).setDepth(30);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(30, 20).setOffset(19, 46);
    body.setAllowGravity(false);

    this.cursors = this.input.keyboard!.createCursorKeys();
    const characterData = characters.find((item) => item.id === this.characterId) ?? characters[0];
    const progress = getVillageProgress();
    this.ui = createPlayableUi(this, this.characterId, characterData.name, progress.energy, progress.coins);

    this.priestHint = this.add.text(PRIEST_X, PRIEST_Y + 72, 'ESPACIO / TOCAR · HABLAR', {
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#f7dea0',
      stroke: '#201409',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(45).setVisible(false);
    this.ui.ignoreWorldObject(this.priestHint);

    this.input.on('pointerdown', this.handlePriestInteraction, this);
    this.input.keyboard?.on('keydown-SPACE', this.handlePriestInteraction, this);
    this.input.keyboard?.on('keydown-ENTER', this.handlePriestInteraction, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', this.handlePriestInteraction, this);
      this.input.keyboard?.off('keydown-SPACE', this.handlePriestInteraction, this);
      this.input.keyboard?.off('keydown-ENTER', this.handlePriestInteraction, this);
      this.clearPriestDialogue();
    });

    this.cameras.main.fadeIn(260, 18, 12, 8);
  }

  update(_time: number, delta: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);
    const touchAction = this.ui.consumeShootRequest();
    const priestNear = this.isPlayerNearPriest();
    this.priestHint?.setVisible(priestNear && this.dialogueStage === 'none' && !this.exiting);

    if (this.exiting || this.dialogueStage !== 'none') return;
    if (priestNear && touchAction) {
      this.handlePriestInteraction();
      return;
    }

    let x = 0;
    let y = 0;
    if (this.cursors.left.isDown || this.ui.touchDirections.left) x -= 1;
    if (this.cursors.right.isDown || this.ui.touchDirections.right) x += 1;
    if (this.cursors.up.isDown || this.ui.touchDirections.up) y -= 1;
    if (this.cursors.down.isDown || this.ui.touchDirections.down) y += 1;

    let moved = false;
    let movingDown = false;

    if (x !== 0 || y !== 0) {
      const movement = new Phaser.Math.Vector2(x, y).normalize();
      this.setFacingFromMovement(movement);
      movingDown = movement.y > 0;

      const safeDelta = Math.min(delta, 50);
      const distance = PLAYER_SPEED * (safeDelta / 1000);
      const result = moveOnInteriorGrid(
        this.player.x,
        this.player.y,
        movement.x * distance,
        movement.y * distance,
        CHURCH_INTERIOR_COLLISION_MAP,
        this.walkableCells,
        PLAYER_FOOTPRINT
      );

      moved = Math.abs(result.movedX) > 0.001 || Math.abs(result.movedY) > 0.001;
      if (moved) {
        this.player.setPosition(result.x, result.y);
        body.updateFromGameObject();
        this.player.anims.play(`church-player-${this.animatedCharacter}-walk-${this.facing}`, true);
      } else {
        this.player.anims.stop();
        this.player.setTexture(`church-player-${this.animatedCharacter}-${this.facing === 'side' ? 'side' : this.facing}`);
      }
    } else {
      this.player.anims.stop();
      this.player.setTexture(`church-player-${this.animatedCharacter}-${this.facing === 'side' ? 'side' : this.facing}`);
    }

    this.checkExit(movingDown && moved);
  }


  private isPlayerNearPriest(): boolean {
    return Math.abs(this.player.x - PRIEST_X) <= PRIEST_REACH_X
      && this.player.y <= PRIEST_REACH_Y;
  }

  private readonly handlePriestInteraction = (event?: KeyboardEvent | Phaser.Input.Pointer): void => {
    // Mantener pulsada ESPACIO no debe saltar las etapas del diálogo.
    if (event && 'repeat' in event && event.repeat) return;
    if (this.exiting || !this.scene.isActive()) return;
    // Evita que una misma pulsación táctil avance dos pantallas o el autorepeat.
    if (this.time.now - this.lastDialogueActionAt < 330) return;

    if (this.dialogueStage === 'none') {
      if (!this.isPlayerNearPriest()) return;
      this.lastDialogueActionAt = this.time.now;
      this.beginPriestDialogue();
    } else if (this.dialogueStage === 'intro') {
      this.lastDialogueActionAt = this.time.now;
      this.showHolderReveal();
    } else if (this.dialogueStage === 'reward' || this.dialogueStage === 'repeat') {
      this.lastDialogueActionAt = this.time.now;
      this.finishPriestDialogue();
    }
  };

  private trackDialogueObject<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.ui.showOnUiCamera(object);
    this.dialogueObjects.push(object);
    return object;
  }

  private createDialogueVeil(opacity: number): void {
    const veil = this.trackDialogueObject(
      this.add.rectangle(this.scale.width / 2, this.scale.height / 2,
        this.scale.width, this.scale.height, 0x07050a)
        .setScrollFactor(0).setDepth(20000).setAlpha(0)
    );
    this.tweens.add({ targets: veil, alpha: opacity, duration: 420, ease: 'Sine.easeOut' });
  }

  private createCenteredPriestText(message: string): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const boxWidth = width * 0.73;
    const boxHeight = height * 0.31;
    const cx = width / 2;
    const cy = height / 2;

    this.trackDialogueObject(
      this.add.rectangle(cx, cy, boxWidth, boxHeight, 0x20160f, 0.98)
        .setStrokeStyle(4, 0xd5ac62)
        .setScrollFactor(0).setDepth(20002)
    );
    this.trackDialogueObject(
      this.add.text(cx, cy - boxHeight * 0.36, 'SACERDOTE DE LA ALDEA', {
        fontFamily: 'IM Fell English, Georgia, serif',
        fontSize: '35px',
        color: '#e8c681',
        align: 'center'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20003)
    );
    this.trackDialogueObject(
      this.add.text(cx, cy - 2, message, {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '40px',
        color: '#fff1d4',
        align: 'center',
        wordWrap: { width: boxWidth - 100 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20003)
    );
    this.trackDialogueObject(
      this.add.text(cx, cy + boxHeight * 0.39,
        'Pulsa ESPACIO, ENTER o toca para continuar', {
          fontFamily: 'Arial', fontSize: '25px', color: '#d4ac69'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20003)
    );
  }

  private beginPriestDialogue(): void {
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
    this.player.anims.stop();
    this.priestHint?.setVisible(false);
    this.clearPriestDialogue();

    const alreadyReceived = getVillageProgress().fragmentHolderReceived;
    this.dialogueStage = alreadyReceived ? 'repeat' : 'intro';
    this.createDialogueVeil(0.62);
    this.createCenteredPriestText(alreadyReceived
      ? 'Conserva bien el contenedor, explorador. Cada fragmento que recuperes te acercará a restaurar la Joya de Arkanis.'
      : 'Explorador, tu misión es recuperar los ocho fragmentos de la Joya de Arkanis. Te entrego este contenedor sagrado. En él podrás guardar cada fragmento que encuentres durante tu viaje.');
  }

  private showHolderReveal(): void {
    this.clearPriestDialogue();
    this.dialogueStage = 'revealing';
    grantFragmentHolderFromPriest();
    this.createDialogueVeil(0.82);

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const glow = this.trackDialogueObject(
      this.add.circle(cx, cy - 50, 250, 0xe4ac4b, 0.17)
        .setScrollFactor(0).setDepth(20001).setScale(0.5).setAlpha(0)
    );
    this.tweens.add({
      targets: glow, alpha: 0.85, scale: 1.3,
      duration: 1600, ease: 'Sine.easeOut',
      onComplete: () => {
        if (this.dialogueStage !== 'revealing' && this.dialogueStage !== 'reward') return;
        this.tweens.add({ targets: glow, alpha: 0.5, scale: 1.1,
          duration: 1250, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    });

    const holder = this.trackDialogueObject(
      this.add.image(cx, cy - 58, JEWEL_HOLDER_TEXTURE)
        .setScrollFactor(0).setDepth(20004).setAlpha(0)
    );
    // Ajuste proporcional: la imagen no se recorta ni se deforma en la pantalla HD.
    const maxWidth = this.scale.width * 0.47;
    const maxHeight = this.scale.height * 0.62;
    const finalScale = Math.min(maxWidth / holder.width, maxHeight / holder.height);
    holder.setScale(finalScale * 0.37);
    this.tweens.add({
      targets: holder, alpha: 1, scale: finalScale,
      duration: 1900, ease: 'Back.easeOut',
      onComplete: () => {
        if (this.dialogueStage !== 'revealing' && this.dialogueStage !== 'reward') return;
        this.tweens.add({ targets: holder, y: cy - 78,
          duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    });

    // Partículas pequeñas, luminosas y animadas alrededor del contenedor.
    for (let i = 0; i < 15; i += 1) {
      const angle = i * Math.PI * 2 / 15;
      const distance = 205 + (i % 4) * 37;
      const x = cx + Math.cos(angle) * distance;
      const y = cy - 55 + Math.sin(angle) * distance * 0.65;
      const mote = this.trackDialogueObject(
        this.add.circle(x, y, 3 + (i % 3), 0xffdc83, 0.95)
          .setScrollFactor(0).setDepth(20003).setAlpha(0)
      );
      this.tweens.add({
        targets: mote, alpha: { from: 0, to: 0.92 },
        y: y - 24, scale: { from: 0.5, to: 1.3 },
        duration: 1250 + (i % 4) * 260,
        delay: i * 85, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }

    const heading = this.trackDialogueObject(
      this.add.text(cx, this.scale.height * 0.84,
        'Has recibido el Contenedor de la Joya de Arkanis', {
          fontFamily: 'IM Fell English, Georgia, serif',
          fontSize: '42px', color: '#ffe6ab',
          stroke: '#24160b', strokeThickness: 4,
          align: 'center', wordWrap: { width: this.scale.width * 0.85 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20005).setAlpha(0)
    );
    const hint = this.trackDialogueObject(
      this.add.text(cx, this.scale.height * 0.925,
        'Pulsa ESPACIO, ENTER o toca para continuar', {
          fontFamily: 'Arial', fontSize: '25px', color: '#d9bd85'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20005).setAlpha(0)
    );
    this.tweens.add({ targets: heading, alpha: 1, delay: 1400, duration: 750 });
    this.tweens.add({ targets: hint, alpha: 1, delay: 2200, duration: 700 });

    // La entrega permanece visible hasta que el jugador quiera continuar.
    this.revealReadyTimer = this.time.delayedCall(3000, () => {
      if (this.dialogueStage === 'revealing') this.dialogueStage = 'reward';
    });
  }

  private finishPriestDialogue(): void {
    this.dialogueStage = 'closing';
    this.tweens.add({
      targets: this.dialogueObjects,
      alpha: 0,
      duration: 360,
      ease: 'Sine.easeInOut',
      onComplete: () => this.clearPriestDialogue()
    });
  }

  private clearPriestDialogue(): void {
    this.revealReadyTimer?.remove(false);
    this.revealReadyTimer = undefined;
    this.tweens.killTweensOf(this.dialogueObjects);
    this.dialogueObjects.forEach((object) => object.destroy());
    this.dialogueObjects = [];
    this.dialogueStage = 'none';
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

  private createPlayerAnimations(): void {
    const create = (direction: Facing, frames: string[], frameRate: number): void => {
      const key = `church-player-${this.animatedCharacter}-walk-${direction}`;
      if (this.anims.exists(key)) this.anims.remove(key);
      this.anims.create({ key, frames: frames.map((frame) => ({ key: frame })), frameRate, repeat: -1 });
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

  private checkExit(movingDown: boolean): void {
    if (!movingDown) return;
    if (Math.abs(this.player.x - ENTRANCE_X) > EXIT_HALF_WIDTH) return;
    if (this.player.y < EXIT_Y) return;
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

import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';
import {
  createPlayableUi,
  preloadPlayableUiAssets,
  type PlayableUiController
} from '../playableSceneUi';
import { getVillageProgress, grantTempleReward } from '../villageProgress';

interface TempleSceneData {
  characterId?: CharacterId;
}

type Facing = 'down' | 'up' | 'side';

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 1080;

// Mismo grid lógico que Cabaña 1:
// 30 columnas sobre 960 px = 32 px.
// 30 filas sobre 1080 px = 36 px.
const GRID_COLUMNS = 30;
const GRID_ROWS = 30;
const CELL_WIDTH = WORLD_WIDTH / GRID_COLUMNS;
const CELL_HEIGHT = WORLD_HEIGHT / GRID_ROWS;

const BACKGROUND_KEY = 'temple-interior-furnished-01';
const GRID_TEXTURE_KEY = 'temple-grid-guide';

const PLAYER_SIZE = 68;
const PLAYER_SPEED = 135;
const PLAYER_FOOT_OFFSET_Y = 25;

// Entrada interior centrada y de cuatro bloques de ancho.
const ENTRANCE_CENTER_X = WORLD_WIDTH / 2;
const ENTRANCE_WIDTH = CELL_WIDTH * 4;
const EXIT_Y = WORLD_HEIGHT - CELL_HEIGHT * 0.55;

const PLAYER_START = {
  x: ENTRANCE_CENTER_X,
  y: WORLD_HEIGHT - CELL_HEIGHT * 1.8
} as const;

// El Templo queda bloqueado por defecto.
// La alfombra central es la única zona transitable por ahora:
// C14..C17 desde F30 hasta F12.
const TEMPLE_WALKABLE_CELLS = new Set<string>();
for (let row = 12; row <= 30; row += 1) {
  for (let column = 14; column <= 17; column += 1) {
    TEMPLE_WALKABLE_CELLS.add(`${column}:${row}`);
  }
}

const KING_REWARD_CELLS = new Set([
  '14:12',
  '15:12',
  '16:12',
  '17:12'
]);

const KING_REWARD_MESSAGE =
  'Se que estás ayudando a que nuestros mundos recuperen la Joya de Arkanis. Ten estas monedas. Te ayudarán a seguir con tu aventura.';

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

export class TempleScene extends Phaser.Scene {
  private characterId: CharacterId = 'tiana';
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private ui!: PlayableUiController;
  private facing: Facing = 'up';
  private exiting = false;
  private messageOpen = false;

  constructor() {
    super('TempleScene');
  }

  init(data: TempleSceneData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.facing = 'up';
    this.exiting = false;
    this.messageOpen = false;
  }

  preload(): void {
    this.load.image(
      BACKGROUND_KEY,
      './assets/environment/interiors/temple/temple-interior-furnished-01.png'
    );

    const assets = CHARACTER_ASSETS[this.characterId === 'lupe' ? 'lupe' : 'tiana'];
    Object.entries(assets).forEach(([key, path]) => {
      this.load.image(`temple-player-${key}`, path);
    });

    preloadPlayableUiAssets(this);
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#120b07');

    this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, BACKGROUND_KEY)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(0);

    this.createGridGuide();
    this.createPlayer();
    this.createPlayerAnimations();

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(260, 18, 12, 8);

    const progress = getVillageProgress();
    const character =
      characters.find((item) => item.id === this.characterId) ?? characters[0];

    this.ui = createPlayableUi(
      this,
      this.characterId,
      character.name,
      progress.energy,
      progress.coins
    );
  }

  update(_time: number, delta: number): void {
    if (this.exiting || this.messageOpen) return;

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
      const safeDelta = Math.min(delta, 50);
      const distance = PLAYER_SPEED * (safeDelta / 1000);

      const moved = this.movePlayerWithinWalkableGrid(
        movement.x * distance,
        movement.y * distance
      );

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

      if (moved) {
        this.player.anims.play(`temple-walk-${this.facing}`, true);
      } else {
        this.player.anims.stop();
        this.player.setTexture(
          `temple-player-${this.facing === 'side' ? 'side' : this.facing}`
        );
      }

      if (movement.y > 0 && moved) {
        this.checkExit();
      }
    } else {
      this.player.anims.stop();
      this.player.setTexture(
        `temple-player-${this.facing === 'side' ? 'side' : this.facing}`
      );
    }

    this.player.setDepth(this.player.y + PLAYER_FOOT_OFFSET_Y);
    this.checkKingReward();
  }

  private isWalkableFootPoint(spriteX: number, spriteY: number): boolean {
    const footX = spriteX;
    const footY = spriteY + PLAYER_FOOT_OFFSET_Y;

    if (
      footX < 0 ||
      footX >= WORLD_WIDTH ||
      footY < 0 ||
      footY >= WORLD_HEIGHT
    ) {
      return false;
    }

    const column = Math.floor(footX / CELL_WIDTH) + 1;
    const row = Math.floor(footY / CELL_HEIGHT) + 1;
    return TEMPLE_WALKABLE_CELLS.has(`${column}:${row}`);
  }

  private movePlayerWithinWalkableGrid(dx: number, dy: number): boolean {
    const maxStep = 4;
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / maxStep)
    );
    const stepX = dx / steps;
    const stepY = dy / steps;
    let moved = false;

    for (let index = 0; index < steps; index += 1) {
      const nextX = this.player.x + stepX;
      if (this.isWalkableFootPoint(nextX, this.player.y)) {
        this.player.x = nextX;
        moved = true;
      }

      const nextY = this.player.y + stepY;
      if (this.isWalkableFootPoint(this.player.x, nextY)) {
        this.player.y = nextY;
        moved = true;
      }
    }

    return moved;
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(
      PLAYER_START.x,
      PLAYER_START.y,
      'temple-player-up'
    );

    this.player
      .setDisplaySize(PLAYER_SIZE, PLAYER_SIZE)
      .setDepth(PLAYER_START.y + PLAYER_FOOT_OFFSET_Y)
      .setCollideWorldBounds(true);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(30, 20).setOffset(19, 46);
    body.setAllowGravity(false);
  }

  private createPlayerAnimations(): void {
    const make = (key: Facing, frames: string[], frameRate: number): void => {
      const animationKey = `temple-walk-${key}`;
      if (this.anims.exists(animationKey)) this.anims.remove(animationKey);

      this.anims.create({
        key: animationKey,
        frames: frames.map((textureKey) => ({ key: textureKey })),
        frameRate,
        repeat: -1
      });
    };

    make('down', ['temple-player-down1', 'temple-player-down2'], 6);
    make('up', ['temple-player-up1', 'temple-player-up2'], 6);
    make(
      'side',
      [
        'temple-player-side1',
        'temple-player-side',
        'temple-player-side2',
        'temple-player-side'
      ],
      8
    );
  }

  private checkKingReward(): void {
    const footX = this.player.x;
    const footY = this.player.y + PLAYER_FOOT_OFFSET_Y;
    const column = Math.floor(footX / CELL_WIDTH) + 1;
    const row = Math.floor(footY / CELL_HEIGHT) + 1;

    if (!KING_REWARD_CELLS.has(`${column}:${row}`)) return;
    if (!grantTempleReward(30)) return;

    const progress = getVillageProgress();
    this.ui.updateCoins(progress.coins);
    this.ui.pulseCoins();
    this.registry.set('arkanis.player.coins', progress.coins);
    this.showKingMessage();
  }

  private showKingMessage(): void {
    this.messageOpen = true;
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
    this.player.anims.stop();

    const view = this.cameras.main.worldView;
    const centerX = view.centerX;
    const centerY = view.centerY;

    const box = this.add.rectangle(
      centerX,
      centerY,
      390,
      180,
      0x130c08,
      0.96
    )
      .setStrokeStyle(3, 0xd6a84b, 1)
      .setDepth(20000)
      .setInteractive({ useHandCursor: true });

    const text = this.add.text(centerX, centerY - 12, KING_REWARD_MESSAGE, {
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: '18px',
      color: '#fff0c7',
      align: 'center',
      wordWrap: { width: 350 }
    })
      .setOrigin(0.5)
      .setDepth(20001);

    const hint = this.add.text(
      centerX,
      centerY + 68,
      'Toca, ESPACIO o ENTER para continuar',
      {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: '#d6a84b'
      }
    )
      .setOrigin(0.5)
      .setDepth(20001);

    // El mensaje pertenece al mundo y se centra en la vista actual de la cámara
    // principal. La cámara fija del HUD debe ignorarlo.
    this.ui.ignoreWorldObject(box);
    this.ui.ignoreWorldObject(text);
    this.ui.ignoreWorldObject(hint);

    const dismiss = (): void => {
      if (!box.active) return;
      box.destroy();
      text.destroy();
      hint.destroy();
      this.messageOpen = false;
    };

    box.once('pointerdown', dismiss);
    this.input.keyboard?.once('keydown-SPACE', dismiss);
    this.input.keyboard?.once('keydown-ENTER', dismiss);
  }

  private checkExit(): void {
    const footY = this.player.y + PLAYER_FOOT_OFFSET_Y;
    const insideEntrance =
      Math.abs(this.player.x - ENTRANCE_CENTER_X) <= ENTRANCE_WIDTH / 2;

    if (!insideEntrance || footY < EXIT_Y) return;
    this.exitToDesert();
  }

  private exitToDesert(): void {
    if (this.exiting) return;
    this.exiting = true;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    this.cameras.main.fadeOut(240, 18, 12, 8);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        if (this.scene.isSleeping('DesertScene')) {
          const desert = this.scene.get('DesertScene') as unknown as {
            returnFromTemple?: () => void;
            cameras: Phaser.Cameras.Scene2D.CameraManager;
          };

          desert.returnFromTemple?.();
          this.scene.wake('DesertScene');
          desert.cameras.main.fadeIn(240, 8, 5, 2);
          this.scene.stop();
          return;
        }

        this.scene.start('DesertScene', { characterId: this.characterId });
      }
    );
  }

  private createGridGuide(): void {
    if (this.textures.exists(GRID_TEXTURE_KEY)) {
      this.textures.remove(GRID_TEXTURE_KEY);
    }

    const texture = this.textures.createCanvas(
      GRID_TEXTURE_KEY,
      WORLD_WIDTH,
      WORLD_HEIGHT
    );
    if (!texture) return;

    const context = texture.context;
    context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Marcamos sutilmente la zona transitable, igual que en el Desierto.
    for (const key of TEMPLE_WALKABLE_CELLS) {
      const [columnText, rowText] = key.split(':');
      const column = Number(columnText);
      const row = Number(rowText);

      context.fillStyle = 'rgba(220, 55, 45, 0.24)';
      context.fillRect(
        (column - 1) * CELL_WIDTH,
        (row - 1) * CELL_HEIGHT,
        CELL_WIDTH,
        CELL_HEIGHT
      );
    }

    context.textBaseline = 'top';
    context.font = '7px Arial';

    for (let column = 0; column <= GRID_COLUMNS; column += 1) {
      const x = column * CELL_WIDTH + 0.5;
      context.beginPath();
      context.strokeStyle = column % 5 === 0
        ? 'rgba(255,220,150,0.62)'
        : 'rgba(255,255,255,0.30)';
      context.lineWidth = column % 5 === 0 ? 1.5 : 1;
      context.moveTo(x, 0);
      context.lineTo(x, WORLD_HEIGHT);
      context.stroke();
    }

    for (let row = 0; row <= GRID_ROWS; row += 1) {
      const y = row * CELL_HEIGHT + 0.5;
      context.beginPath();
      context.strokeStyle = row % 5 === 0
        ? 'rgba(255,220,150,0.62)'
        : 'rgba(255,255,255,0.30)';
      context.lineWidth = row % 5 === 0 ? 1.5 : 1;
      context.moveTo(0, y);
      context.lineTo(WORLD_WIDTH, y);
      context.stroke();
    }

    for (let row = 1; row <= GRID_ROWS; row += 1) {
      for (let column = 1; column <= GRID_COLUMNS; column += 1) {
        const x = (column - 1) * CELL_WIDTH + 2;
        const y = (row - 1) * CELL_HEIGHT + 2;
        const label =
          `C${String(column).padStart(2, '0')}/F${String(row).padStart(2, '0')}`;

        context.lineWidth = 2;
        context.strokeStyle = 'rgba(45,20,8,0.82)';
        context.strokeText(label, x, y);
        context.fillStyle = 'rgba(255,236,190,0.90)';
        context.fillText(label, x, y);
      }
    }

    texture.refresh();

    this.add.image(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      GRID_TEXTURE_KEY
    )
      .setDepth(10000)
      .setAlpha(0.95);
  }
}

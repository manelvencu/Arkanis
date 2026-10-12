import * as Phaser from 'phaser';
import type { CharacterId } from '../gameData';

interface TempleSceneData {
  characterId?: CharacterId;
}

type Facing = 'down' | 'up' | 'side';

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 1080;

// Mantenemos exactamente el mismo tamaño lógico de celda que en Cabaña 1:
// 30 columnas sobre 960 px = 32 px de ancho.
// Cabaña 1 tiene 15 filas sobre 540 px = 36 px de alto.
// El Templo duplica la altura: 30 filas sobre 1080 px = 36 px de alto.
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
  private facing: Facing = 'up';
  private exiting = false;

  constructor() {
    super('TempleScene');
  }

  init(data: TempleSceneData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.facing = 'up';
    this.exiting = false;
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

    // Misma escala visual que Cabaña 1: zoom 2.
    // Como el Templo mide el doble de alto, la cámara recorre verticalmente el interior.
    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(260, 18, 12, 8);
  }

  update(): void {
    if (this.exiting) return;

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

      this.player.anims.play(`temple-walk-${this.facing}`, true);

      if (movement.y > 0) {
        this.checkExit();
      }
    } else {
      this.player.anims.stop();
      this.player.setTexture(
        `temple-player-${this.facing === 'side' ? 'side' : this.facing}`
      );
    }

    this.player.setDepth(this.player.y + PLAYER_FOOT_OFFSET_Y);
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

        // Si entramos al Templo directamente desde el menú de desarrollo,
        // no existe una instancia jugable del Desierto a la que volver.
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

    // Marcamos la anchura física de la entrada inferior (4 bloques).
    const entranceLeft = ENTRANCE_CENTER_X - ENTRANCE_WIDTH / 2;
    context.fillStyle = 'rgba(70,180,255,0.18)';
    context.fillRect(
      entranceLeft,
      WORLD_HEIGHT - CELL_HEIGHT,
      ENTRANCE_WIDTH,
      CELL_HEIGHT
    );

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

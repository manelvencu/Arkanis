import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';
import { getVillageProgress } from '../villageProgress';
import { createPlayableUi, preloadPlayableUiAssets, type PlayableUiController } from '../playableSceneUi';

interface FireLandsSceneData {
  characterId?: CharacterId;
}

type Facing = 'down' | 'up' | 'side';

const GRID_SIZE = 32;
const WORLD_COLUMNS = 128;
const WORLD_ROWS = 96;
const WORLD_WIDTH = WORLD_COLUMNS * GRID_SIZE;
const WORLD_HEIGHT = WORLD_ROWS * GRID_SIZE;
const GRID_TEXTURE_KEY = 'fire-lands-grid-guide';
const BACKGROUND_TEXTURE_KEY = 'fire-lands-world-bg';

const PLAYER_SIZE = 64;
const PLAYER_SPEED = 180;
const PLAYER_START_CELL = { column: 10, row: 85 } as const;
const PLAYER_START = {
  x: (PLAYER_START_CELL.column - 0.5) * GRID_SIZE,
  y: (PLAYER_START_CELL.row - 0.5) * GRID_SIZE - 20
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



/** Prototipo de escala y distribución espacial de Las Tierras del Fuego. */
export class FireLandsScene extends Phaser.Scene {
  private characterId: CharacterId = 'tiana';
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private facing: Facing = 'side';
  private ui!: PlayableUiController;
  private lastStatusCell = '';
  private mapKey!: Phaser.Input.Keyboard.Key;
  private overviewEnabled = false;

  constructor() {
    super('FireLandsScene');
  }

  init(data: FireLandsSceneData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.facing = 'side';
    this.lastStatusCell = '';
    this.overviewEnabled = false;
  }

  preload(): void {
    this.load.image(BACKGROUND_TEXTURE_KEY, './assets/world/fire-lands-world-01.webp');
    preloadPlayableUiAssets(this);
    const characterKey = this.characterId === 'lupe' ? 'lupe' : 'tiana';
    Object.entries(CHARACTER_ASSETS[characterKey]).forEach(([key, path]) => {
      this.load.image(`fire-lands-player-${key}`, path);
    });
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#000000');

    // Fondo estático definitivo: ocupa exactamente el tablero 128x96.
    // Sin polígonos de colores, textos de zonas ni puentes provisionales.
    this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, BACKGROUND_TEXTURE_KEY)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(0);
    this.createGridGuide();
    this.createPlayer();
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.mapKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);

    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(500, 18, 5, 2);

    const progress = getVillageProgress();
    const character = characters.find((item) => item.id === this.characterId) ?? characters[0];
    this.ui = createPlayableUi(
      this, this.characterId, character.name, progress.energy, progress.coins
    );
    this.registry.set('arkanis.player.energy', progress.energy);
    this.registry.set('arkanis.player.coins', progress.coins);
    this.updateCellStatus();
  }

  update(_time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.mapKey)) this.toggleOverview();
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
    let x = 0;
    let y = 0;
    if (this.cursors.left.isDown || this.ui.touchDirections.left) x -= 1;
    if (this.cursors.right.isDown || this.ui.touchDirections.right) x += 1;
    if (this.cursors.up.isDown || this.ui.touchDirections.up) y -= 1;
    if (this.cursors.down.isDown || this.ui.touchDirections.down) y += 1;

    if (x === 0 && y === 0) {
      this.player.anims.stop();
      this.player.setTexture('fire-lands-player-' + (this.facing === 'side' ? 'side' : this.facing));
      return;
    }

    const movement = new Phaser.Math.Vector2(x, y).normalize();
    const distance = PLAYER_SPEED * (Math.min(delta, 50) / 1000);
    const dx = movement.x * distance;
    const dy = movement.y * distance;

    // Separar ejes permite bordear orillas sin atravesar la lava.
    if (this.isWalkableFootPoint(this.player.x + dx, this.player.y)) {
      this.player.x += dx;
    }
    if (this.isWalkableFootPoint(this.player.x, this.player.y + dy)) {
      this.player.y += dy;
    }

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
    this.player.anims.play('fire-lands-walk-' + this.facing, true);
    this.player.setDepth(this.player.y + 20);
    this.updateCellStatus();
  }

  private toggleOverview(): void {
    this.overviewEnabled = !this.overviewEnabled;
    if (this.overviewEnabled) {
      this.cameras.main.stopFollow();
      const zoom = Math.min(this.scale.width / WORLD_WIDTH, this.scale.height / WORLD_HEIGHT) * 0.92;
      this.cameras.main.setZoom(zoom);
      this.cameras.main.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    } else {
      this.cameras.main.setZoom(2);
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }
    this.lastStatusCell = '';
    this.updateCellStatus();
  }

  private updateCellStatus(): void {
    const footX = this.player.x;
    const footY = this.player.y + 20;
    const column = Math.floor(footX / GRID_SIZE) + 1;
    const row = Math.floor(footY / GRID_SIZE) + 1;
    const cell = column + ':' + row;
    if (cell === this.lastStatusCell) return;
    this.lastStatusCell = cell;
    // Mientras diseñamos el mundo, todas las celdas son transitables.
    this.ui.updateStatus('FUEGO · C' + column + 'F' + row
      + (this.overviewEnabled ? ' · M: VOLVER' : ' · M: VER MAPA'));
  }

  private isWalkableFootPoint(spriteX: number, spriteY: number): boolean {
    const footY = spriteY + 20;
    // Prototipo de exploración: lava, puentes e islas sin colisiones.
    // Únicamente se impide abandonar los límites del mundo.
    return spriteX >= 14 && spriteX < WORLD_WIDTH - 14
      && footY >= 14 && footY < WORLD_HEIGHT - 14;
  }

  private createPlayer(): void {
    const makeAnimation = (key: Facing, frames: string[]): void => {
      const animationKey = `fire-lands-walk-${key}`;
      if (this.anims.exists(animationKey)) return;

      this.anims.create({
        key: animationKey,
        frames: frames.map((frame) => ({ key: frame })),
        frameRate: key === 'side' ? 8 : 6,
        repeat: -1
      });
    };

    makeAnimation('down', ['fire-lands-player-down1', 'fire-lands-player-down2']);
    makeAnimation('side', [
      'fire-lands-player-side1',
      'fire-lands-player-side',
      'fire-lands-player-side2',
      'fire-lands-player-side'
    ]);
    makeAnimation('up', ['fire-lands-player-up1', 'fire-lands-player-up2']);

    this.player = this.physics.add.sprite(
      PLAYER_START.x,
      PLAYER_START.y,
      'fire-lands-player-side'
    );

    this.player
      .setDisplaySize(PLAYER_SIZE, PLAYER_SIZE)
      .setDepth(PLAYER_START.y + 20)
      .setCollideWorldBounds(true);

    (this.player.body as Phaser.Physics.Arcade.Body)
      .setSize(28, 24)
      .setOffset(18, 36);
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
    context.font = '6px Arial';

    for (let column = 0; column <= WORLD_COLUMNS; column += 1) {
      const x = column * GRID_SIZE + 0.5;
      context.beginPath();
      context.strokeStyle = column % 5 === 0
        ? 'rgba(255,214,158,0.70)'
        : 'rgba(255,240,225,0.30)';
      context.lineWidth = column % 5 === 0 ? 1.5 : 1;
      context.moveTo(x, 0);
      context.lineTo(x, WORLD_HEIGHT);
      context.stroke();
    }

    for (let row = 0; row <= WORLD_ROWS; row += 1) {
      const y = row * GRID_SIZE + 0.5;
      context.beginPath();
      context.strokeStyle = row % 5 === 0
        ? 'rgba(255,214,158,0.70)'
        : 'rgba(255,240,225,0.30)';
      context.lineWidth = row % 5 === 0 ? 1.5 : 1;
      context.moveTo(0, y);
      context.lineTo(WORLD_WIDTH, y);
      context.stroke();
    }

    for (let row = 1; row <= WORLD_ROWS; row += 1) {
      for (let column = 1; column <= WORLD_COLUMNS; column += 1) {
        const x = (column - 1) * GRID_SIZE + 2;
        const y = (row - 1) * GRID_SIZE + 2;
        const label = `C${column}F${row}`;

        context.lineWidth = 2;
        context.strokeStyle = 'rgba(54,10,7,0.82)';
        context.strokeText(label, x, y);
        context.fillStyle = 'rgba(255,225,188,0.92)';
        context.fillText(label, x, y);
      }
    }

    texture.refresh();

    this.add.image(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      GRID_TEXTURE_KEY
    )
      .setDepth(8)
      .setAlpha(0.65);
  }
}

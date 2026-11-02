import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';
import { getVillageProgress, setVillageEnergy } from '../villageProgress';
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
const PLAYER_START_CELL = { column: 2, row: 68 } as const;
const PLAYER_START = {
  x: (PLAYER_START_CELL.column - 0.5) * GRID_SIZE,
  y: (PLAYER_START_CELL.row - 0.5) * GRID_SIZE - 20
} as const;


// Revisión de recorrido 02-11-2026. Toda celda fuera de estos rangos está bloqueada.
// Cada rango es inclusivo y usa columnas C y filas F (ambas comienzan en 1).
type FireCellRange = readonly [c1: number, f1: number, c2: number, f2: number];
const FIRE_WALKABLE_RANGES: readonly FireCellRange[] = [
  [1, 66, 3, 66],
  [1, 67, 6, 67],
  [1, 68, 5, 68],
  [3, 69, 8, 69],
  [6, 70, 14, 70],
  [6, 71, 22, 71],
  [7, 72, 21, 72],
  [7, 73, 21, 73],
  [7, 74, 21, 74],
  [7, 75, 20, 75],
  [8, 76, 20, 76],
  [10, 77, 22, 77],
  [15, 78, 23, 78],
  [16, 79, 25, 79],
  [17, 80, 27, 80],
  [20, 81, 26, 81],
  [21, 82, 28, 82],
  [27, 83, 30, 83],
  [21, 84, 21, 84],
  [26, 84, 31, 84],
  [27, 85, 31, 85],
  [28, 86, 31, 86],
  [28, 87, 30, 87],
  [32, 88, 32, 88],
  [22, 70, 25, 70],
  [25, 69, 27, 69],
  [27, 68, 29, 68],
  [29, 67, 31, 67],
  [30, 66, 58, 66]
];

const FIRE_WALKABLE_CELLS = new Set<string>();
for (const [c1, f1, c2, f2] of FIRE_WALKABLE_RANGES) {
  for (let f = f1; f <= f2; f += 1) {
    for (let col = c1; col <= c2; col += 1) {
      FIRE_WALKABLE_CELLS.add(`${col}:${f}`);
    }
  }
}

// Amarillo = transitable, pero causa daño. Estas tres casillas también
// pertenecen al conjunto verde anterior y por eso se puede entrar en ellas.
const FIRE_DAMAGE_CELLS: ReadonlySet<string> = new Set([
  '21:84',
  '36:66',
  '53:66'
]);
const FIRE_DAMAGE_AMOUNT = 20;
const FIRE_DAMAGE_COOLDOWN_MS = 1200;
const FOOT_OFFSET_Y = 20;

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
  private lastDamageAt = -FIRE_DAMAGE_COOLDOWN_MS;
  private gameOver = false;

  constructor() {
    super('FireLandsScene');
  }

  init(data: FireLandsSceneData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.facing = 'side';
    this.lastStatusCell = '';
    this.overviewEnabled = false;
    this.lastDamageAt = -FIRE_DAMAGE_COOLDOWN_MS;
    this.gameOver = false;
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

  update(time: number, delta: number): void {
    if (this.gameOver) return;
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
      this.checkDamageTile(time);
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
    this.checkDamageTile(time);
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

  private getFootCell(spriteX: number, spriteY: number): { column: number; row: number } | null {
    const footY = spriteY + FOOT_OFFSET_Y;
    if (spriteX < 0 || spriteX >= WORLD_WIDTH || footY < 0 || footY >= WORLD_HEIGHT) return null;
    return {
      column: Math.floor(spriteX / GRID_SIZE) + 1,
      row: Math.floor(footY / GRID_SIZE) + 1
    };
  }

  private updateCellStatus(): void {
    const foot = this.getFootCell(this.player.x, this.player.y);
    if (!foot) return;
    const cell = `${foot.column}:${foot.row}`;
    if (cell === this.lastStatusCell) return;
    this.lastStatusCell = cell;
    const zone = FIRE_DAMAGE_CELLS.has(cell) ? ' · DAÑO' : ' · TRANSITABLE';
    this.ui.updateStatus(
      `FUEGO · C${foot.column}F${foot.row}${zone}`
      + (this.overviewEnabled ? ' · M: VOLVER' : ' · M: VER MAPA')
    );
  }

  private isWalkableFootPoint(spriteX: number, spriteY: number): boolean {
    const foot = this.getFootCell(spriteX, spriteY);
    return !!foot && FIRE_WALKABLE_CELLS.has(`${foot.column}:${foot.row}`);
  }

  private checkDamageTile(time: number): void {
    const foot = this.getFootCell(this.player.x, this.player.y);
    if (!foot || !FIRE_DAMAGE_CELLS.has(`${foot.column}:${foot.row}`)) return;
    if (time - this.lastDamageAt < FIRE_DAMAGE_COOLDOWN_MS) return;
    this.lastDamageAt = time;

    const nextEnergy = Math.max(0, getVillageProgress().energy - FIRE_DAMAGE_AMOUNT);
    setVillageEnergy(nextEnergy);
    this.registry.set('arkanis.player.energy', nextEnergy);
    this.ui.updateEnergy(nextEnergy);
    this.cameras.main.shake(180, 0.007);
    this.player.setTint(0xff5544);
    this.time.delayedCall(180, () => {
      if (this.player.active) this.player.clearTint();
    });

    if (nextEnergy === 0) {
      this.gameOver = true;
      this.player.anims.stop();
      this.time.delayedCall(220, () => {
        this.scene.launch('GameOverScene', {
          characterId: this.characterId,
          sourceSceneKey: 'FireLandsScene'
        });
        this.scene.pause();
      });
    }
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
    if (this.textures.exists(GRID_TEXTURE_KEY)) this.textures.remove(GRID_TEXTURE_KEY);
    const texture = this.textures.createCanvas(GRID_TEXTURE_KEY, WORLD_WIDTH, WORLD_HEIGHT);
    if (!texture) return;
    const ctx = texture.context;

    // El mapa entero está bloqueado por defecto: rojo.
    ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.fillStyle = 'rgba(220, 39, 45, 0.34)';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Abrimos únicamente las casillas solicitadas y les damos fondo verde.
    for (const key of FIRE_WALKABLE_CELLS) {
      const [column, row] = key.split(':').map(Number);
      const x = (column - 1) * GRID_SIZE;
      const y = (row - 1) * GRID_SIZE;
      ctx.clearRect(x, y, GRID_SIZE, GRID_SIZE);
      ctx.fillStyle = 'rgba(21, 190, 84, 0.45)';
      ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
    }

    // El amarillo tiene prioridad visual sobre el verde, sin impedir el paso.
    for (const key of FIRE_DAMAGE_CELLS) {
      const [column, row] = key.split(':').map(Number);
      const x = (column - 1) * GRID_SIZE;
      const y = (row - 1) * GRID_SIZE;
      ctx.clearRect(x, y, GRID_SIZE, GRID_SIZE);
      ctx.fillStyle = 'rgba(255, 214, 26, 0.65)';
      ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
    }

    ctx.strokeStyle = 'rgba(21, 16, 16, 0.76)';
    ctx.lineWidth = 1;
    for (let column = 0; column <= WORLD_COLUMNS; column += 1) {
      const x = column * GRID_SIZE + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_HEIGHT);
      ctx.stroke();
    }
    for (let row = 0; row <= WORLD_ROWS; row += 1) {
      const y = row * GRID_SIZE + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_WIDTH, y);
      ctx.stroke();
    }

    // Coordenadas visibles a zoom 2: C2 / F68, etc.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 8px Arial';
    for (let row = 1; row <= WORLD_ROWS; row += 1) {
      for (let col = 1; col <= WORLD_COLUMNS; col += 1) {
        const x = (col - 0.5) * GRID_SIZE;
        const y = (row - 1) * GRID_SIZE;
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillStyle = '#ffffff';
        ctx.strokeText(`C${col}`, x, y + 11);
        ctx.fillText(`C${col}`, x, y + 11);
        ctx.strokeText(`F${row}`, x, y + 23);
        ctx.fillText(`F${row}`, x, y + 23);
      }
    }

    texture.refresh();
    this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, GRID_TEXTURE_KEY)
      .setDepth(8)
      .setAlpha(0.92);
  }

}

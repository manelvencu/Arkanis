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



type TerrainPoint = readonly [number, number];
type TerrainRegion = {
  name: string;
  points: TerrainPoint[];
  color: number;
  outline: number;
};
type PrototypeBridge = { from: TerrainPoint; to: TerrainPoint; name: string };

// Distribución del recorrido: inicio → poblado → hostiles → rocas ardientes
// → recompensas → gran volcán → paso oriental → volcán final.
// El resto del mundo es lava intransitable, no un suelo gris continuo.
const LAND_ZONES: TerrainRegion[] = [
  { name: 'ZONA SEGURA', color: 0x70a657, outline: 0x3c6840,
    points: [[0,73],[8,72],[16,74],[23,80],[28,88],[31,96],[0,96]] },
  { name: 'TRANSICIÓN', color: 0x637c4d, outline: 0x4d6043,
    points: [[15,72],[22,69],[29,76],[28,84],[22,87],[15,81]] },
  { name: 'POBLADO', color: 0x99999a, outline: 0x56535a,
    points: [[16,49],[29,43],[51,43],[64,49],[71,60],[68,77],[56,84],[38,84],[26,79],[14,67]] },
  { name: 'ZONA HOSTIL', color: 0x554d4c, outline: 0x292529,
    points: [[76,71],[87,65],[105,65],[120,70],[123,81],[113,94],[91,93],[75,85]] },
  { name: 'ROCAS ARDIENTES', color: 0x6d4f45, outline: 0x382c2c,
    points: [[90,41],[101,34],[115,37],[121,47],[116,59],[101,60],[89,53]] },
  { name: 'RECOMPENSAS', color: 0x898177, outline: 0x4e4543,
    points: [[50,28],[61,22],[77,22],[85,30],[82,41],[68,45],[51,40]] },
  { name: 'GRAN VOLCÁN', color: 0x4d4140, outline: 0x272326,
    points: [[10,14],[20,8],[39,9],[50,20],[47,36],[32,40],[13,34],[7,24]] },
  { name: 'PASO ORIENTAL', color: 0x645456, outline: 0x312c30,
    points: [[59,12],[67,8],[80,11],[83,22],[72,27],[60,22]] },
  { name: 'VOLCÁN FINAL', color: 0x504044, outline: 0x272125,
    points: [[91,13],[103,5],[120,7],[127,18],[121,31],[104,32],[91,25]] }
];
const BRIDGES: PrototypeBridge[] = [
  { name: 'Poblado → Hostiles', from: [63,72], to: [81,77] },
  { name: 'Hostiles → Rocas', from: [108,71], to: [108,56] },
  { name: 'Rocas → Recompensas', from: [92,45], to: [79,36] },
  { name: 'Recompensas → Gran Volcán', from: [53,31], to: [45,27] },
  { name: 'Gran Volcán → Paso Oriental', from: [45,18], to: [62,17] },
  { name: 'Paso Oriental → Volcán Final', from: [79,17], to: [95,19] }
];
function pixelPoint(point: TerrainPoint): Phaser.Math.Vector2 {
  return new Phaser.Math.Vector2(point[0] * GRID_SIZE, point[1] * GRID_SIZE);
}
const LAND_POLYGONS = LAND_ZONES.map((zone) => ({
  name: zone.name,
  polygon: new Phaser.Geom.Polygon(zone.points.map(pixelPoint))
}));
function distanceToSegment(x: number, y: number, start: Phaser.Math.Vector2, end: Phaser.Math.Vector2): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Phaser.Math.Clamp(
    ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared, 0, 1
  );
  return Phaser.Math.Distance.Between(x, y, start.x + t * dx, start.y + t * dy);
}

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
    const region = LAND_POLYGONS.find((zone) =>
      Phaser.Geom.Polygon.Contains(zone.polygon, footX, footY)
    );
    const area = region?.name ?? 'PUENTE';
    this.ui.updateStatus('FUEGO · C' + column + 'F' + row + ' · ' + area
      + (this.overviewEnabled ? ' · M: VOLVER' : ' · M: VER MAPA'));
  }

  private isWalkableFootPoint(spriteX: number, spriteY: number): boolean {
    const footY = spriteY + 20;
    if (spriteX < 14 || spriteX >= WORLD_WIDTH - 14 || footY < 14 || footY >= WORLD_HEIGHT - 14) return false;
    if (LAND_POLYGONS.some((zone) =>
      Phaser.Geom.Polygon.Contains(zone.polygon, spriteX, footY)
    )) return true;
    // Solo los seis puentes unen las islas: no se puede atravesar lava roja.
    return BRIDGES.some((bridge) =>
      distanceToSegment(spriteX, footY, pixelPoint(bridge.from), pixelPoint(bridge.to)) <= GRID_SIZE * 1.15
    );
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

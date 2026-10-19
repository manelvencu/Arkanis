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

const PLAYER_SIZE = 64;
const PLAYER_SPEED = 180;
const PLAYER_START_CELL = { column: 13, row: 85 } as const;
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
type LavaStream = { points: TerrainPoint[]; width: number };
type PrototypeBridge = { from: TerrainPoint; to: TerrainPoint };

const GREEN_ZONE: TerrainPoint[] = [
  [0, 66], [9, 62], [17, 65], [25, 72], [33, 80], [47, 96], [0, 96]
];
const VILLAGE_ZONE: TerrainPoint[] = [
  [24, 51], [40, 47], [57, 50], [65, 59],
  [59, 70], [44, 78], [29, 76], [20, 64]
];

// Prototipo espacial: cauces dibujados en rojo y bloqueados salvo los puentes.
const LAVA_STREAMS: LavaStream[] = [
  { width: 5.5, points: [[0, 48], [14, 49], [30, 44], [48, 49], [65, 45], [80, 41], [103, 47], [128, 41]] },
  { width: 5.5, points: [[66, 0], [71, 17], [75, 30], [79, 43], [75, 60], [82, 73], [80, 96]] },
  { width: 4.5, points: [[20, 96], [24, 84], [27, 74], [35, 65], [44, 57]] },
  { width: 3.8, points: [[101, 96], [108, 82], [103, 67], [110, 55], [128, 52]] }
];
const BRIDGES: PrototypeBridge[] = [
  { from: [18, 75], to: [35, 75] },
  { from: [53, 38], to: [53, 58] },
  { from: [67, 62], to: [87, 62] },
  { from: [99, 60], to: [119, 60] }
];

function pixelPoint(point: TerrainPoint): Phaser.Math.Vector2 {
  return new Phaser.Math.Vector2(point[0] * GRID_SIZE, point[1] * GRID_SIZE);
}

function distanceToSegment(
  x: number, y: number,
  start: Phaser.Math.Vector2, end: Phaser.Math.Vector2
): number {
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

  constructor() {
    super('FireLandsScene');
  }

  init(data: FireLandsSceneData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.facing = 'side';
    this.lastStatusCell = '';
  }

  preload(): void {
    preloadPlayableUiAssets(this);
    const characterKey = this.characterId === 'lupe' ? 'lupe' : 'tiana';
    Object.entries(CHARACTER_ASSETS[characterKey]).forEach(([key, path]) => {
      this.load.image(`fire-lands-player-${key}`, path);
    });
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#333036');

    this.createSpatialZones();
    this.createLavaRiversAndBridges();
    this.createGridGuide();
    this.createPlayer();
    this.cursors = this.input.keyboard!.createCursorKeys();

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

  private updateCellStatus(): void {
    const column = Math.floor(this.player.x / GRID_SIZE) + 1;
    const row = Math.floor((this.player.y + 20) / GRID_SIZE) + 1;
    const cell = column + ':' + row;
    if (cell === this.lastStatusCell) return;
    this.lastStatusCell = cell;
    const safe = Phaser.Geom.Polygon.Contains(
      new Phaser.Geom.Polygon(GREEN_ZONE.map(pixelPoint)), this.player.x, this.player.y + 20
    );
    const village = Phaser.Geom.Polygon.Contains(
      new Phaser.Geom.Polygon(VILLAGE_ZONE.map(pixelPoint)), this.player.x, this.player.y + 20
    );
    const area = safe ? 'ZONA VERDE' : village ? 'POBLADO' : 'TERRENO VOLCÁNICO';
    this.ui.updateStatus('TIERRAS DEL FUEGO · C' + column + 'F' + row + ' · ' + area);
  }

  private isWalkableFootPoint(spriteX: number, spriteY: number): boolean {
    const footY = spriteY + 20;
    if (spriteX < 14 || spriteX >= WORLD_WIDTH - 14 || footY < 14 || footY >= WORLD_HEIGHT - 14) return false;
    const onBridge = BRIDGES.some((bridge) =>
      distanceToSegment(spriteX, footY, pixelPoint(bridge.from), pixelPoint(bridge.to)) < GRID_SIZE * 1.15
    );
    if (onBridge) return true;
    return !LAVA_STREAMS.some((stream) => {
      const points = stream.points.map(pixelPoint);
      return points.slice(1).some((end, index) =>
        distanceToSegment(spriteX, footY, points[index], end) <= stream.width * GRID_SIZE * 0.5
      );
    });
  }

  private createSpatialZones(): void {
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x37343a).setDepth(0);
    const g = this.add.graphics().setDepth(1);
    const fillPolygon = (points: TerrainPoint[], color: number): void => {
      g.fillStyle(color, 1);
      g.fillPoints(points.map(pixelPoint), true);
    };
    // Llanura verde de entrada, aislada del terreno volcánico.
    fillPolygon(GREEN_ZONE, 0x689b52);
    // Zona gris reservada para casas, tienda, plaza y personajes del poblado.
    fillPolygon(VILLAGE_ZONE, 0x929292);
    // Grandes manchas ocres de reserva para conos volcánicos, sin assets todavía.
    g.fillStyle(0x714337, 1);
    [[18, 22, 13], [55, 18, 12], [102, 16, 16], [109, 81, 11], [58, 86, 10]]
      .forEach(([x, y, radius]) => g.fillCircle(x * GRID_SIZE, y * GRID_SIZE, radius * GRID_SIZE));

    this.add.text(10 * GRID_SIZE, 87 * GRID_SIZE, 'ZONA VERDE · INICIO', {
      fontFamily: 'Arial', fontSize: '26px', color: '#ffffff',
      backgroundColor: '#315a32', padding: { x: 8, y: 6 }
    }).setDepth(10);
    this.add.text(34 * GRID_SIZE, 58 * GRID_SIZE, 'POBLADO (GRIS)', {
      fontFamily: 'Arial', fontSize: '26px', color: '#ffffff',
      backgroundColor: '#545454', padding: { x: 8, y: 6 }
    }).setDepth(10);
    this.add.text(95 * GRID_SIZE, 16 * GRID_SIZE, 'VOLCÁN FINAL · FUTURO RETO', {
      fontFamily: 'Arial', fontSize: '24px', color: '#ffe8be',
      backgroundColor: '#4e3028', padding: { x: 8, y: 6 }
    }).setDepth(10);
  }

  private createLavaRiversAndBridges(): void {
    const g = this.add.graphics().setDepth(3);
    for (const stream of LAVA_STREAMS) {
      const points = stream.points.map(pixelPoint);
      const width = stream.width * GRID_SIZE;
      // Orilla oscura, cauce rojo y brillo anaranjado para distinguir la lava.
      g.lineStyle(width + GRID_SIZE, 0x211a1b, 1);
      g.strokePoints(points, false);
      g.lineStyle(width, 0xcf2921, 1);
      g.strokePoints(points, false);
      g.lineStyle(width * 0.38, 0xf2762b, 0.8);
      g.strokePoints(points, false);
    }
    const bridges = this.add.graphics().setDepth(5);
    for (const bridge of BRIDGES) {
      const start = pixelPoint(bridge.from);
      const end = pixelPoint(bridge.to);
      bridges.lineStyle(GRID_SIZE * 2.3, 0x241e1b, 1);
      bridges.strokeLineShape(new Phaser.Geom.Line(start.x, start.y, end.x, end.y));
      bridges.lineStyle(GRID_SIZE * 1.9, 0xb09a71, 1);
      bridges.strokeLineShape(new Phaser.Geom.Line(start.x, start.y, end.x, end.y));
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

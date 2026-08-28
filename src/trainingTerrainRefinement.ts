import * as Phaser from 'phaser';
import { TrainingScene } from './scenes/TrainingScene';

const GRID_SIZE = 32;
const TERRAIN_TILE_CELLS = 4;
const TERRAIN_TILE_SIZE = GRID_SIZE * TERRAIN_TILE_CELLS;
const WORLD_COLUMNS = 45;
const WORLD_ROWS = 28;
const WORLD_WIDTH = WORLD_COLUMNS * GRID_SIZE;
const WORLD_HEIGHT = WORLD_ROWS * GRID_SIZE;
const TERRAIN_DEPTH = 3;

const TOP_GRASS_ROWS = 5;
const LEFT_GRASS_COLUMNS = 4;
const BOTTOM_GRASS_START_ROW = 25;
const RIGHT_GRASS_START_COLUMN = 38;

const TOP_GRASS_HEIGHT = TOP_GRASS_ROWS * GRID_SIZE;
const LEFT_GRASS_WIDTH = LEFT_GRASS_COLUMNS * GRID_SIZE;
const BOTTOM_GRASS_Y = (BOTTOM_GRASS_START_ROW - 1) * GRID_SIZE;
const RIGHT_GRASS_X = (RIGHT_GRASS_START_COLUMN - 1) * GRID_SIZE;

const INTERIOR_X = LEFT_GRASS_WIDTH;
const INTERIOR_Y = TOP_GRASS_HEIGHT;
const INTERIOR_WIDTH = RIGHT_GRASS_X - INTERIOR_X;
const INTERIOR_HEIGHT = BOTTOM_GRASS_Y - INTERIOR_Y;

const CABIN_DISPLAY_WIDTH = 270;
const CABIN_DISPLAY_HEIGHT = 205;
const CABIN_BODY_WIDTH = 220;
const CABIN_BODY_HEIGHT = 92;
const CABIN_SUPPORT_POINTS: Array<[number, number]> = [
  [368, 272], // C12/F09
  [688, 272], // C22/F09
  [1008, 272] // C32/F09
];

const SPIKE_GRID_POSITIONS: Array<[number, number]> = [
  [11, 21], [13, 21], [16, 21], [18, 21], [20, 21], [22, 21], [24, 21], [26, 21], [34, 21],
  [11, 22], [34, 22],
  [18, 24], [20, 24], [22, 24], [24, 24], [26, 24], [28, 24], [30, 24], [32, 24],
  [11, 25], [33, 26]
];

const COIN_GRID_POSITIONS: Array<[number, number]> = [
  [12, 20], [15, 20], [19, 20], [22, 20], [26, 20], [29, 20],
  [31, 23], [29, 23], [26, 23], [22, 23], [19, 23], [15, 23],
  [13, 25], [17, 26], [21, 26], [25, 26], [29, 26]
];

type TrainingPrototype = {
  __terrainRefinementInstalled?: boolean;
  create: (this: TrainingScene) => void;
};

type TrainingZigzagRuntime = {
  spikes: Phaser.Physics.Arcade.StaticGroup;
  coins: Phaser.Physics.Arcade.StaticGroup;
};

export function installTrainingTerrainRefinement(): void {
  const prototype = TrainingScene.prototype as unknown as TrainingPrototype;
  if (prototype.__terrainRefinementInstalled) return;

  const originalCreate = prototype.create;
  prototype.__terrainRefinementInstalled = true;

  prototype.create = function createWithTerrainRefinement(this: TrainingScene): void {
    originalCreate.call(this);

    addTerrainGrid(this);
    alignCabinsToGrid(this);
    alignZigzagToGrid(this);
  };
}

function alignCabinsToGrid(scene: Phaser.Scene): void {
  const cabins = scene.children.list
    .filter((child): child is Phaser.Physics.Arcade.Image =>
      child instanceof Phaser.Physics.Arcade.Image
      && child.texture.key === 'training-cabin'
    )
    .sort((a, b) => a.x - b.x);

  cabins.forEach((cabin, index) => {
    const supportPoint = CABIN_SUPPORT_POINTS[index];
    if (!supportPoint) return;

    const [supportX, supportY] = supportPoint;
    const visualCenterY = supportY - (CABIN_DISPLAY_HEIGHT - CABIN_BODY_HEIGHT) / 2;

    cabin
      .setPosition(supportX, visualCenterY)
      .setDisplaySize(CABIN_DISPLAY_WIDTH, CABIN_DISPLAY_HEIGHT)
      .refreshBody();

    (cabin.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(CABIN_BODY_WIDTH, CABIN_BODY_HEIGHT)
      .setOffset(
        (CABIN_DISPLAY_WIDTH - CABIN_BODY_WIDTH) / 2,
        CABIN_DISPLAY_HEIGHT - CABIN_BODY_HEIGHT
      );
  });
}

function alignZigzagToGrid(scene: Phaser.Scene): void {
  const runtime = scene as unknown as TrainingZigzagRuntime;

  runtime.spikes.clear(true, true);

  runtime.coins.getChildren().forEach((coin) => {
    scene.tweens.killTweensOf(coin);
  });
  runtime.coins.clear(true, true);

  SPIKE_GRID_POSITIONS.forEach(([column, row]) => {
    const [x, y] = gridCellCenter(column, row);
    const spike = runtime.spikes.create(x, y, 'training-spikes') as Phaser.Physics.Arcade.Image;
    spike.setDisplaySize(58, 48).setDepth(4).refreshBody();
    (spike.body as Phaser.Physics.Arcade.StaticBody).setSize(48, 30).setOffset(5, 12);
  });

  COIN_GRID_POSITIONS.forEach(([column, row]) => {
    const [x, y] = gridCellCenter(column, row);
    const coin = runtime.coins.create(x, y, 'training-coin') as Phaser.Physics.Arcade.Image;
    coin.setDisplaySize(23, 23).setDepth(10).refreshBody();
    scene.tweens.add({ targets: coin, y: y - 5, duration: 800, yoyo: true, repeat: -1 });
  });
}

function gridCellCenter(column: number, row: number): [number, number] {
  return [
    (column - 1) * GRID_SIZE + GRID_SIZE / 2,
    (row - 1) * GRID_SIZE + GRID_SIZE / 2
  ];
}

function addTerrainGrid(scene: Phaser.Scene): void {
  addScaledTerrain(
    scene,
    'training-dirt',
    INTERIOR_X,
    INTERIOR_Y,
    INTERIOR_WIDTH,
    INTERIOR_HEIGHT
  );

  addScaledTerrain(scene, 'training-grass', 0, 0, WORLD_WIDTH, TOP_GRASS_HEIGHT);
  addScaledTerrain(
    scene,
    'training-grass',
    0,
    TOP_GRASS_HEIGHT,
    LEFT_GRASS_WIDTH,
    WORLD_HEIGHT - TOP_GRASS_HEIGHT
  );
  addScaledTerrain(
    scene,
    'training-grass',
    LEFT_GRASS_WIDTH,
    BOTTOM_GRASS_Y,
    WORLD_WIDTH - LEFT_GRASS_WIDTH,
    WORLD_HEIGHT - BOTTOM_GRASS_Y
  );
  addScaledTerrain(
    scene,
    'training-grass',
    RIGHT_GRASS_X,
    TOP_GRASS_HEIGHT,
    WORLD_WIDTH - RIGHT_GRASS_X,
    BOTTOM_GRASS_Y - TOP_GRASS_HEIGHT
  );
}

function addScaledTerrain(
  scene: Phaser.Scene,
  textureKey: string,
  x: number,
  y: number,
  width: number,
  height: number
): Phaser.GameObjects.TileSprite {
  const source = scene.textures.get(textureKey).getSourceImage() as { width: number; height: number };
  const terrain = scene.add.tileSprite(
    x + width / 2,
    y + height / 2,
    width,
    height,
    textureKey
  ).setDepth(TERRAIN_DEPTH);

  terrain.setTileScale(
    TERRAIN_TILE_SIZE / source.width,
    TERRAIN_TILE_SIZE / source.height
  );

  return terrain;
}

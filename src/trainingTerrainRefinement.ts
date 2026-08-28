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

const TOP_GRASS_ROWS = 4;
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

type TrainingPrototype = {
  __terrainRefinementInstalled?: boolean;
  create: (this: TrainingScene) => void;
};

export function installTrainingTerrainRefinement(): void {
  const prototype = TrainingScene.prototype as unknown as TrainingPrototype;
  if (prototype.__terrainRefinementInstalled) return;

  const originalCreate = prototype.create;
  prototype.__terrainRefinementInstalled = true;

  prototype.create = function createWithTerrainRefinement(this: TrainingScene): void {
    originalCreate.call(this);

    addTerrainGrid(this);
  };
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

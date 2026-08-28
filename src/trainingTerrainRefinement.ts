import * as Phaser from 'phaser';
import { TrainingScene } from './scenes/TrainingScene';

const GRID_SIZE = 32;
const GRASS_TILE_CELLS = 4;
const GRASS_TILE_SIZE = GRID_SIZE * GRASS_TILE_CELLS;
const TOP_GRASS_ROWS = 4;
const TOP_GRASS_HEIGHT = GRID_SIZE * TOP_GRASS_ROWS;
const WORLD_WIDTH = 45 * GRID_SIZE;

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

    removeTreesFromTopGrassBand(this);
    addTopGrassBand(this);
  };
}

function removeTreesFromTopGrassBand(scene: Phaser.Scene): void {
  scene.children.list
    .filter((child): child is Phaser.Physics.Arcade.Image =>
      child instanceof Phaser.Physics.Arcade.Image
      && child.texture.key === 'training-tree'
      && child.y < TOP_GRASS_HEIGHT
    )
    .forEach((tree) => tree.destroy());
}

function addTopGrassBand(scene: Phaser.Scene): void {
  const source = scene.textures.get('training-grass').getSourceImage() as { width: number; height: number };
  const grassBand = scene.add.tileSprite(
    WORLD_WIDTH / 2,
    TOP_GRASS_HEIGHT / 2,
    WORLD_WIDTH,
    TOP_GRASS_HEIGHT,
    'training-grass'
  ).setDepth(3);

  grassBand.setTileScale(
    GRASS_TILE_SIZE / source.width,
    GRASS_TILE_SIZE / source.height
  );
}

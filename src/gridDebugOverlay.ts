import * as Phaser from 'phaser';
import { TrainingScene } from './scenes/TrainingScene';

const GRID_SIZE = 32;
const GRID_COLUMNS = 45;
const GRID_ROWS = 28;
const GRID_WORLD_WIDTH = GRID_COLUMNS * GRID_SIZE;
const GRID_WORLD_HEIGHT = GRID_ROWS * GRID_SIZE;
const GRID_TEXTURE_KEY = 'training-grid-debug-overlay';

type TrainingPrototype = {
  __gridDebugInstalled?: boolean;
  create: (this: TrainingScene) => void;
};

export function installTrainingGridDebugOverlay(): void {
  const prototype = TrainingScene.prototype as unknown as TrainingPrototype;
  if (prototype.__gridDebugInstalled) return;

  const originalCreate = prototype.create;
  prototype.__gridDebugInstalled = true;

  prototype.create = function createWithGridDebug(this: TrainingScene): void {
    originalCreate.call(this);

    this.physics.world.setBounds(0, 0, GRID_WORLD_WIDTH, GRID_WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, GRID_WORLD_WIDTH, GRID_WORLD_HEIGHT);

    createGridOverlay(this);
  };
}

function createGridOverlay(scene: Phaser.Scene): void {
  if (scene.textures.exists(GRID_TEXTURE_KEY)) {
    scene.textures.remove(GRID_TEXTURE_KEY);
  }

  const texture = scene.textures.createCanvas(GRID_TEXTURE_KEY, GRID_WORLD_WIDTH, GRID_WORLD_HEIGHT);
  if (!texture) return;

  const context = texture.context;
  context.clearRect(0, 0, GRID_WORLD_WIDTH, GRID_WORLD_HEIGHT);
  context.textBaseline = 'top';
  context.font = '7px Arial';

  for (let column = 0; column <= GRID_COLUMNS; column += 1) {
    const x = column * GRID_SIZE + 0.5;
    context.beginPath();
    context.strokeStyle = column % 5 === 0 ? 'rgba(255,245,175,0.48)' : 'rgba(255,255,255,0.22)';
    context.lineWidth = column % 5 === 0 ? 1.5 : 1;
    context.moveTo(x, 0);
    context.lineTo(x, GRID_WORLD_HEIGHT);
    context.stroke();
  }

  for (let row = 0; row <= GRID_ROWS; row += 1) {
    const y = row * GRID_SIZE + 0.5;
    context.beginPath();
    context.strokeStyle = row % 5 === 0 ? 'rgba(255,245,175,0.48)' : 'rgba(255,255,255,0.22)';
    context.lineWidth = row % 5 === 0 ? 1.5 : 1;
    context.moveTo(0, y);
    context.lineTo(GRID_WORLD_WIDTH, y);
    context.stroke();
  }

  for (let row = 1; row <= GRID_ROWS; row += 1) {
    for (let column = 1; column <= GRID_COLUMNS; column += 1) {
      const x = (column - 1) * GRID_SIZE + 2;
      const y = (row - 1) * GRID_SIZE + 2;
      const label = `C${String(column).padStart(2, '0')}/F${String(row).padStart(2, '0')}`;

      context.lineWidth = 2;
      context.strokeStyle = 'rgba(0,0,0,0.72)';
      context.strokeText(label, x, y);
      context.fillStyle = 'rgba(255,244,170,0.82)';
      context.fillText(label, x, y);
    }
  }

  texture.refresh();

  scene.add.image(GRID_WORLD_WIDTH / 2, GRID_WORLD_HEIGHT / 2, GRID_TEXTURE_KEY)
    .setDepth(900)
    .setAlpha(0.9);
}

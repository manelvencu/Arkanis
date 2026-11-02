import * as Phaser from 'phaser';
import { TrainingScene } from './scenes/TrainingScene';
import { getTrainingReadChestCount } from './trainingProgress';

const GRID_SIZE = 32;

const CABIN_DISPLAY_WIDTH = 270;
const CABIN_DISPLAY_HEIGHT = 205;
const CABIN_BODY_WIDTH = 220;
const CABIN_BODY_HEIGHT = 92;
const CABIN_SUPPORT_POINTS: Array<[number, number]> = [
  [368, 272], // C12/F09
  [688, 272], // C22/F09
  [1008, 272] // C32/F09
];

// Distribución nueva, variada y estable: se mezcla la colocación sin
// mover objetos aleatoriamente cada vez que se entra a la ZE.
// Todos los puntos se sitúan dentro del rectángulo transitable de tierra.
const SPIKE_GRID_POSITIONS: Array<[number, number]> = [
  [17, 18], [14, 22], [17, 11], [12, 18], [14, 14], [21, 19], [6, 16],
  [7, 22], [19, 22], [15, 17], [16, 20], [9, 17], [36, 22], [19, 20],
  [33, 23], [7, 19], [10, 12], [11, 14], [25, 17], [22, 23], [33, 20]
];

const COIN_GRID_POSITIONS: Array<[number, number]> = [
  [26, 15], [6, 13], [32, 13], [28, 11], [8, 14], [25, 23],
  [32, 17], [25, 12], [14, 19], [27, 18], [34, 18],
  [10, 20], [29, 16], [11, 22], [24, 20], [19, 12], [23, 15]
];

const POT_GRID_POSITIONS: Array<[number, number]> = [
  [9, 23], [29, 19], [7, 11], [27, 13], [11, 16],
  [35, 12], [35, 20], [18, 15], [21, 21], [17, 22]
];

const PORTAL_GRID_POSITION: [number, number] = [35, 15];
const REQUIRED_CHESTS = 3;

type TrainingPrototype = {
  __terrainRefinementInstalled?: boolean;
  create: (this: TrainingScene) => void;
  collectCoin: (this: TrainingScene, coin: Phaser.Physics.Arcade.Image) => void;
  checkUnlock: (this: TrainingScene) => void;
};

type TrainingRuntime = {
  spikes: Phaser.Physics.Arcade.StaticGroup;
  coins: Phaser.Physics.Arcade.StaticGroup;
  pots: Phaser.Physics.Arcade.StaticGroup;
  barrier: Phaser.Physics.Arcade.Image;
  barrierCollider?: Phaser.Physics.Arcade.Collider;
  potsDestroyed: number;
  coinsCollected: number;
  exitUnlocked: boolean;
  updateHud: () => void;
  checkUnlock: () => void;
};

export function installTrainingTerrainRefinement(): void {
  const prototype = TrainingScene.prototype as unknown as TrainingPrototype;
  if (prototype.__terrainRefinementInstalled) return;

  const originalCreate = prototype.create;
  const originalCollectCoin = prototype.collectCoin;
  prototype.__terrainRefinementInstalled = true;

  prototype.checkUnlock = function checkUnlockWithFullProgress(this: TrainingScene): void {
    const runtime = this as unknown as TrainingRuntime;
    const allPotsDestroyed = runtime.potsDestroyed === POT_GRID_POSITIONS.length;
    const allCoinsCollected = runtime.coinsCollected === COIN_GRID_POSITIONS.length;
    const allChestsRead = getTrainingReadChestCount() >= REQUIRED_CHESTS;

    if (runtime.exitUnlocked || !allPotsDestroyed || !allCoinsCollected || !allChestsRead) return;

    runtime.exitUnlocked = true;
    runtime.barrierCollider?.destroy();
    runtime.barrierCollider = undefined;
    (runtime.barrier.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    runtime.barrier.setVisible(true).setAlpha(1);
    this.tweens.add({
      targets: runtime.barrier,
      alpha: 0.55,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    runtime.updateHud();
  };

  prototype.collectCoin = function collectCoinWithUnlockCheck(
    this: TrainingScene,
    coin: Phaser.Physics.Arcade.Image
  ): void {
    originalCollectCoin.call(this, coin);
    (this as unknown as TrainingRuntime).checkUnlock();
  };

  prototype.create = function createWithTerrainRefinement(this: TrainingScene): void {
    originalCreate.call(this);

    alignCabinsToGrid(this);
    alignZigzagToGrid(this);
    alignPotsToGrid(this);
    configurePortal(this);
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
  const runtime = scene as unknown as TrainingRuntime;

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

function alignPotsToGrid(scene: Phaser.Scene): void {
  const runtime = scene as unknown as TrainingRuntime;
  runtime.pots.clear(true, true);

  POT_GRID_POSITIONS.forEach(([column, row], index) => {
    const [x, y] = gridCellCenter(column, row);
    const pot = runtime.pots.create(x, y, 'training-potIntact') as Phaser.Physics.Arcade.Image;
    pot.setDisplaySize(44, 47).setDepth(11).refreshBody();
    (pot.body as Phaser.Physics.Arcade.StaticBody).setSize(36, 39).setOffset(4, 8);
    pot.setData('broken', false);
    pot.setData('potIndex', index);
  });
}

function configurePortal(scene: Phaser.Scene): void {
  const runtime = scene as unknown as TrainingRuntime;
  const [x, y] = gridCellCenter(...PORTAL_GRID_POSITION);

  runtime.barrierCollider?.destroy();
  runtime.barrierCollider = undefined;
  runtime.barrier
    .setPosition(x, y)
    .setVisible(false)
    .setAlpha(0)
    .refreshBody();
  (runtime.barrier.body as Phaser.Physics.Arcade.StaticBody).enable = false;

  runtime.checkUnlock();
  scene.events.on(Phaser.Scenes.Events.WAKE, runtime.checkUnlock, scene);
  scene.events.on(Phaser.Scenes.Events.RESUME, runtime.checkUnlock, scene);
}

function gridCellCenter(column: number, row: number): [number, number] {
  return [
    (column - 1) * GRID_SIZE + GRID_SIZE / 2,
    (row - 1) * GRID_SIZE + GRID_SIZE / 2
  ];
}


import * as Phaser from 'phaser';
import { TrainingScene } from './scenes/TrainingScene';
import { CabinInteriorScene } from './scenes/CabinInteriorScene';

const HD_SCALE = 2;
const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 540;
const ENERGY_FULL_WIDTH = 220;
const ENERGY_FILL_HEIGHT = 16;

type TrainingPrototype = {
  __hdRenderingInstalled?: boolean;
  create: (this: TrainingScene) => void;
  updateHud: (this: TrainingScene) => void;
};

type TrainingRuntime = {
  energy: number;
  energyGold: Phaser.GameObjects.Image;
  energyRed: Phaser.GameObjects.Image;
  coinCounter: Phaser.GameObjects.Text;
  progressText: Phaser.GameObjects.Text;
};

type CabinPrototype = {
  __hdRenderingInstalled?: boolean;
  create: (this: CabinInteriorScene) => void;
};

function textureKey(child: Phaser.GameObjects.GameObject): string | undefined {
  return child instanceof Phaser.GameObjects.Image ? child.texture.key : undefined;
}

function getDepth(child: Phaser.GameObjects.GameObject): number {
  return (child as unknown as { depth?: number }).depth ?? 0;
}

function layoutTrainingUi(scene: TrainingScene): void {
  const runtime = scene as unknown as TrainingRuntime;

  const hudFrame = scene.children.list.find((child) => textureKey(child) === 'training-hudFrame') as Phaser.GameObjects.Image | undefined;
  hudFrame?.setPosition(LOGICAL_WIDTH / 2, 45).setDisplaySize(LOGICAL_WIDTH - 20, 82);

  const energyFrame = scene.children.list.find((child) => textureKey(child) === 'training-energyFrame') as Phaser.GameObjects.Image | undefined;
  energyFrame?.setPosition(190, 105).setDisplaySize(264, 34);

  runtime.energyGold?.setPosition(80, 105).setOrigin(0, 0.5).setDisplaySize(ENERGY_FULL_WIDTH, ENERGY_FILL_HEIGHT);
  runtime.energyRed?.setPosition(80, 105).setOrigin(0, 0.5).setDisplaySize(ENERGY_FULL_WIDTH, ENERGY_FILL_HEIGHT);

  const coinIcon = scene.children.list.find((child) =>
    child instanceof Phaser.GameObjects.Image &&
    child.texture.key === 'training-coin' &&
    child.scrollFactorX === 0
  ) as Phaser.GameObjects.Image | undefined;
  coinIcon?.setPosition(LOGICAL_WIDTH - 190, 41).setDisplaySize(25, 25);

  const menu = scene.children.list.find((child) => textureKey(child) === 'training-menu') as Phaser.GameObjects.Image | undefined;
  menu?.setPosition(LOGICAL_WIDTH - 80, 44).setDisplaySize(40, 40);

  runtime.coinCounter?.setPosition(LOGICAL_WIDTH - 165, 41);
  runtime.progressText?.setPosition(LOGICAL_WIDTH / 2, 44);

  const characterName = scene.children.list.find((child) =>
    child instanceof Phaser.GameObjects.Text &&
    child.y === 44 &&
    child.x < 400 &&
    child !== runtime.progressText
  ) as Phaser.GameObjects.Text | undefined;
  characterName?.setPosition(185, 44);
}

function createTrainingUiCamera(scene: TrainingScene): void {
  const uiObjects = scene.children.list.filter((child) => getDepth(child) >= 1000);
  const worldObjects = scene.children.list.filter((child) => getDepth(child) < 1000);

  const uiCamera = scene.cameras.add(0, 0, 1920, 1080, false, 'TrainingUICamera');
  uiCamera.setZoom(HD_SCALE);
  uiCamera.centerOn(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
  uiCamera.setRoundPixels(false);

  scene.cameras.main.ignore(uiObjects);
  uiCamera.ignore(worldObjects);
}

export function installHdRenderingRefinement(): void {
  const trainingPrototype = TrainingScene.prototype as unknown as TrainingPrototype;
  if (!trainingPrototype.__hdRenderingInstalled) {
    const originalCreate = trainingPrototype.create;
    const originalUpdateHud = trainingPrototype.updateHud;
    trainingPrototype.__hdRenderingInstalled = true;

    trainingPrototype.create = function createHdTraining(this: TrainingScene): void {
      originalCreate.call(this);
      this.cameras.main.setZoom(HD_SCALE);
      layoutTrainingUi(this);
      originalUpdateHud.call(this);
      createTrainingUiCamera(this);
    };

    trainingPrototype.updateHud = function updateHdHud(this: TrainingScene): void {
      originalUpdateHud.call(this);
      const runtime = this as unknown as TrainingRuntime;
      const fillWidth = ENERGY_FULL_WIDTH * (runtime.energy / 100);
      const isCritical = runtime.energy < 30;

      runtime.energyGold
        .setPosition(80, 105)
        .setDisplaySize(fillWidth, ENERGY_FILL_HEIGHT)
        .setVisible(!isCritical);
      runtime.energyRed
        .setPosition(80, 105)
        .setDisplaySize(fillWidth, ENERGY_FILL_HEIGHT)
        .setVisible(isCritical);
    };
  }

  const cabinPrototype = CabinInteriorScene.prototype as unknown as CabinPrototype;
  if (!cabinPrototype.__hdRenderingInstalled) {
    const originalCabinCreate = cabinPrototype.create;
    cabinPrototype.__hdRenderingInstalled = true;
    cabinPrototype.create = function createHdCabin(this: CabinInteriorScene): void {
      originalCabinCreate.call(this);
      this.cameras.main.setZoom(1.55 * HD_SCALE);
    };
  }
}

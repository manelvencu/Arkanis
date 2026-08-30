import * as Phaser from 'phaser';
import { TrainingScene } from './scenes/TrainingScene';
import { CabinInteriorScene } from './scenes/CabinInteriorScene';

const HD_SCALE = 2;
const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 540;
const PHYSICAL_WIDTH = LOGICAL_WIDTH * HD_SCALE;
const PHYSICAL_HEIGHT = LOGICAL_HEIGHT * HD_SCALE;
const ENERGY_FULL_WIDTH = 220 * HD_SCALE;
const ENERGY_FILL_HEIGHT = 16 * HD_SCALE;

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

function depthOf(child: Phaser.GameObjects.GameObject): number {
  return (child as unknown as { depth?: number }).depth ?? 0;
}

function scaleTextToHd(text: Phaser.GameObjects.Text | undefined): void {
  if (!text) return;
  text.setScale(HD_SCALE).setScrollFactor(0);
}

function layoutTrainingUi(scene: TrainingScene): Phaser.GameObjects.GameObject[] {
  const runtime = scene as unknown as TrainingRuntime;

  const hudFrame = scene.children.list.find((child) => textureKey(child) === 'training-hudFrame') as Phaser.GameObjects.Image | undefined;
  hudFrame?.setPosition(PHYSICAL_WIDTH / 2, 45 * HD_SCALE)
    .setDisplaySize((LOGICAL_WIDTH - 20) * HD_SCALE, 82 * HD_SCALE)
    .setScrollFactor(0);

  const energyFrame = scene.children.list.find((child) => textureKey(child) === 'training-energyFrame') as Phaser.GameObjects.Image | undefined;
  energyFrame?.setPosition(190 * HD_SCALE, 105 * HD_SCALE)
    .setDisplaySize(264 * HD_SCALE, 34 * HD_SCALE)
    .setScrollFactor(0);

  runtime.energyGold?.setPosition(80 * HD_SCALE, 105 * HD_SCALE)
    .setOrigin(0, 0.5)
    .setDisplaySize(ENERGY_FULL_WIDTH, ENERGY_FILL_HEIGHT)
    .setScrollFactor(0);
  runtime.energyRed?.setPosition(80 * HD_SCALE, 105 * HD_SCALE)
    .setOrigin(0, 0.5)
    .setDisplaySize(ENERGY_FULL_WIDTH, ENERGY_FILL_HEIGHT)
    .setScrollFactor(0);

  const coinIcon = scene.children.list.find((child) =>
    child instanceof Phaser.GameObjects.Image &&
    child.texture.key === 'training-coin' &&
    depthOf(child) >= 1000
  ) as Phaser.GameObjects.Image | undefined;
  coinIcon?.setPosition((LOGICAL_WIDTH - 190) * HD_SCALE, 41 * HD_SCALE)
    .setDisplaySize(25 * HD_SCALE, 25 * HD_SCALE)
    .setScrollFactor(0);

  const menu = scene.children.list.find((child) => textureKey(child) === 'training-menu') as Phaser.GameObjects.Image | undefined;
  menu?.setPosition((LOGICAL_WIDTH - 80) * HD_SCALE, 44 * HD_SCALE)
    .setDisplaySize(40 * HD_SCALE, 40 * HD_SCALE)
    .setScrollFactor(0);

  runtime.coinCounter?.setPosition((LOGICAL_WIDTH - 165) * HD_SCALE, 41 * HD_SCALE).setScrollFactor(0);
  runtime.progressText?.setPosition((LOGICAL_WIDTH / 2) * HD_SCALE, 44 * HD_SCALE).setScrollFactor(0);
  scaleTextToHd(runtime.coinCounter);
  scaleTextToHd(runtime.progressText);

  const characterName = scene.children.list.find((child) =>
    child instanceof Phaser.GameObjects.Text &&
    child.y < 100 &&
    child.x < 500 &&
    child !== runtime.progressText
  ) as Phaser.GameObjects.Text | undefined;
  characterName?.setPosition(185 * HD_SCALE, 44 * HD_SCALE);
  scaleTextToHd(characterName);

  // Todo objeto de interfaz se creó con depth >= 1000 en TrainingScene.
  return scene.children.list.filter((child) => depthOf(child) >= 1000);
}

function createTrainingUiCamera(scene: TrainingScene, uiObjects: Phaser.GameObjects.GameObject[]): void {
  const worldObjects = scene.children.list.filter((child) => !uiObjects.includes(child));
  const uiCamera = scene.cameras.add(0, 0, PHYSICAL_WIDTH, PHYSICAL_HEIGHT, false, 'TrainingUICamera');
  uiCamera.setZoom(1);
  uiCamera.setScroll(0, 0);
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
      const uiObjects = layoutTrainingUi(this);
      originalUpdateHud.call(this);
      createTrainingUiCamera(this, uiObjects);
    };

    trainingPrototype.updateHud = function updateHdHud(this: TrainingScene): void {
      originalUpdateHud.call(this);
      const runtime = this as unknown as TrainingRuntime;
      const fillWidth = ENERGY_FULL_WIDTH * (runtime.energy / 100);
      const isCritical = runtime.energy < 30;

      runtime.energyGold
        .setPosition(80 * HD_SCALE, 105 * HD_SCALE)
        .setDisplaySize(fillWidth, ENERGY_FILL_HEIGHT)
        .setVisible(!isCritical)
        .setScrollFactor(0);
      runtime.energyRed
        .setPosition(80 * HD_SCALE, 105 * HD_SCALE)
        .setDisplaySize(fillWidth, ENERGY_FILL_HEIGHT)
        .setVisible(isCritical)
        .setScrollFactor(0);
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

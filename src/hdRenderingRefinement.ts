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

const DPAD_CENTER_X = 112 * HD_SCALE;
const DPAD_CENTER_Y = (LOGICAL_HEIGHT - 108) * HD_SCALE;
const DPAD_SPACING = 56 * HD_SCALE;
const MAGIC_X = (LOGICAL_WIDTH - 105) * HD_SCALE;
const MAGIC_Y = (LOGICAL_HEIGHT - 105) * HD_SCALE;
const CONTROL_DEPTH = 1200;

type TouchDirection = 'left' | 'right' | 'up' | 'down';

type TrainingPrototype = {
  __hdRenderingInstalled?: boolean;
  create: (this: TrainingScene) => void;
  updateHud: (this: TrainingScene) => void;
  shootMagicRay: (this: TrainingScene) => void;
};

type TrainingRuntime = {
  energy: number;
  energyGold: Phaser.GameObjects.Image;
  energyRed: Phaser.GameObjects.Image;
  coinCounter: Phaser.GameObjects.Text;
  progressText: Phaser.GameObjects.Text;
  touchDirections: Record<TouchDirection, boolean>;
  touchShootRequested: boolean;
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

function createCleanTouchControls(scene: TrainingScene): void {
  const runtime = scene as unknown as TrainingRuntime;

  // Elimina por completo los controles creados por TrainingScene antes de construir
  // la versión HD. Así evitamos restos, botones duplicados y posiciones mezcladas.
  scene.children.list
    .filter((child) => depthOf(child) >= CONTROL_DEPTH)
    .slice()
    .forEach((child) => child.destroy());

  const directions: Array<{ direction: TouchDirection; label: string; x: number; y: number }> = [
    { direction: 'left', label: '◀', x: DPAD_CENTER_X - DPAD_SPACING, y: DPAD_CENTER_Y },
    { direction: 'right', label: '▶', x: DPAD_CENTER_X + DPAD_SPACING, y: DPAD_CENTER_Y },
    { direction: 'up', label: '▲', x: DPAD_CENTER_X, y: DPAD_CENTER_Y - DPAD_SPACING },
    { direction: 'down', label: '▼', x: DPAD_CENTER_X, y: DPAD_CENTER_Y + DPAD_SPACING }
  ];

  directions.forEach(({ label, x, y }) => {
    scene.add.circle(x, y, 50, 0x171421, 0.68)
      .setStrokeStyle(6, 0xf1d16a, 0.9)
      .setScrollFactor(0)
      .setDepth(CONTROL_DEPTH);
    scene.add.text(x, y, label, {
      fontFamily: 'Arial',
      fontSize: '50px',
      color: '#fff1ad',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(CONTROL_DEPTH + 1);
  });

  const magicButton = scene.add.circle(MAGIC_X, MAGIC_Y, 68, 0x7a302d, 0.84)
    .setStrokeStyle(6, 0xf0a08c, 0.98)
    .setScrollFactor(0)
    .setDepth(CONTROL_DEPTH)
    .setInteractive({ useHandCursor: true });

  scene.add.text(MAGIC_X, MAGIC_Y, '✦', {
    fontFamily: 'Arial',
    fontSize: '62px',
    color: '#ffe9df',
    fontStyle: 'bold'
  }).setOrigin(0.5).setScrollFactor(0).setDepth(CONTROL_DEPTH + 1);

  magicButton.on('pointerdown', () => {
    runtime.touchShootRequested = true;
    magicButton.setFillStyle(0xa9473b, 0.96);
  });
  const restoreMagic = (): void => {
    magicButton.setFillStyle(0x7a302d, 0.84);
  };
  magicButton.on('pointerup', restoreMagic);
  magicButton.on('pointerout', restoreMagic);
  magicButton.on('pointerupoutside', restoreMagic);

  let dpadPointerId: number | null = null;

  const clearDirections = (): void => {
    runtime.touchDirections.left = false;
    runtime.touchDirections.right = false;
    runtime.touchDirections.up = false;
    runtime.touchDirections.down = false;
  };

  const updateDirectionFromPointer = (pointer: Phaser.Input.Pointer): void => {
    const dx = pointer.x - DPAD_CENTER_X;
    const dy = pointer.y - DPAD_CENTER_Y;
    const deadZone = 36;

    clearDirections();
    if (Math.abs(dx) > deadZone) runtime.touchDirections[dx < 0 ? 'left' : 'right'] = true;
    if (Math.abs(dy) > deadZone) runtime.touchDirections[dy < 0 ? 'up' : 'down'] = true;
  };

  scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (Phaser.Math.Distance.Between(pointer.x, pointer.y, DPAD_CENTER_X, DPAD_CENTER_Y) <= 200) {
      dpadPointerId = pointer.id;
      updateDirectionFromPointer(pointer);
    }
  });

  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    if (pointer.id !== dpadPointerId || !pointer.isDown) return;
    updateDirectionFromPointer(pointer);
  });

  const releaseDpad = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.id !== dpadPointerId) return;
    dpadPointerId = null;
    clearDirections();
  };

  scene.input.on('pointerup', releaseDpad);
  scene.input.on('pointerupoutside', releaseDpad);
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

  createCleanTouchControls(scene);

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
    const originalShootMagicRay = trainingPrototype.shootMagicRay;
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

    trainingPrototype.shootMagicRay = function shootSingleHdRay(this: TrainingScene): void {
      const before = new Set(this.children.list);
      originalShootMagicRay.call(this);
      const uiCamera = this.cameras.getCamera('TrainingUICamera');
      if (!uiCamera) return;
      const newWorldObjects = this.children.list.filter((child) => !before.has(child));
      uiCamera.ignore(newWorldObjects);
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

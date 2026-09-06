import * as Phaser from 'phaser';
import { characters, type CharacterId } from './gameData';
import {
  createPlayableUi,
  preloadPlayableUiAssets,
  type PlayableUiController
} from './playableSceneUi';
import { TrainingScene } from './scenes/TrainingScene';

const HD_SCALE = 2;
const LEGACY_UI_MIN_DEPTH = 1000;

type TouchDirection = 'left' | 'right' | 'up' | 'down';

type TrainingPrototype = {
  __hdRenderingInstalled?: boolean;
  preload: (this: TrainingScene) => void;
  create: (this: TrainingScene) => void;
  update: (this: TrainingScene, time: number) => void;
  updateHud: (this: TrainingScene) => void;
  shootMagicRay: (this: TrainingScene) => void;
};

type TrainingRuntime = {
  characterId: CharacterId;
  energy: number;
  coinsCollected: number;
  potsDestroyed: number;
  touchDirections: Record<TouchDirection, boolean>;
  touchShootRequested: boolean;
  __sharedPlayableUi?: PlayableUiController;
};

function depthOf(child: Phaser.GameObjects.GameObject): number {
  return (child as unknown as { depth?: number }).depth ?? 0;
}

function removeLegacyTrainingUi(scene: TrainingScene): void {
  scene.children.list
    .filter((child) => depthOf(child) >= LEGACY_UI_MIN_DEPTH)
    .slice()
    .forEach((child) => child.destroy());
}

function syncSharedHud(scene: TrainingScene): void {
  const runtime = scene as unknown as TrainingRuntime;
  const ui = runtime.__sharedPlayableUi;
  if (!ui) return;

  ui.updateEnergy(runtime.energy);
  ui.updateCoins(runtime.coinsCollected);
  ui.updateStatus(`Vasijas ${runtime.potsDestroyed}/10`);
}

/**
 * TrainingScene nació con un HUD propio. Este refinement mantiene intacta su lógica
 * de juego, pero elimina esa segunda implementación visual y la sustituye por el
 * mismo PlayableUiController que usan La Aldea y los interiores.
 *
 * Resultado: energía, color crítico, monedas, controles y geometría del HUD tienen
 * una única fuente de verdad para todas las escenas jugables.
 */
export function installHdRenderingRefinement(): void {
  const trainingPrototype = TrainingScene.prototype as unknown as TrainingPrototype;
  if (trainingPrototype.__hdRenderingInstalled) return;
  trainingPrototype.__hdRenderingInstalled = true;

  const originalPreload = trainingPrototype.preload;
  const originalCreate = trainingPrototype.create;
  const originalUpdate = trainingPrototype.update;
  const originalUpdateHud = trainingPrototype.updateHud;
  const originalShootMagicRay = trainingPrototype.shootMagicRay;

  trainingPrototype.preload = function preloadSharedHud(this: TrainingScene): void {
    originalPreload.call(this);
    preloadPlayableUiAssets(this);
  };

  trainingPrototype.create = function createHdTraining(this: TrainingScene): void {
    const runtime = this as unknown as TrainingRuntime;

    // originalCreate sigue creando temporalmente el HUD histórico porque forma parte
    // de TrainingScene. updateHud usa el fallback antiguo hasta que exista el compartido.
    originalCreate.call(this);
    this.cameras.main.setZoom(HD_SCALE);

    removeLegacyTrainingUi(this);

    const character = characters.find((item) => item.id === runtime.characterId) ?? characters[0];
    runtime.__sharedPlayableUi = createPlayableUi(
      this,
      runtime.characterId,
      character.name,
      runtime.energy,
      runtime.coinsCollected
    );

    // TrainingScene continúa leyendo touchDirections y touchShootRequested internamente.
    // Compartimos el mismo objeto de direcciones para no duplicar la lógica de control.
    runtime.touchDirections = runtime.__sharedPlayableUi.touchDirections;
    syncSharedHud(this);
  };

  trainingPrototype.update = function updateWithSharedHud(this: TrainingScene, time: number): void {
    const runtime = this as unknown as TrainingRuntime;
    const ui = runtime.__sharedPlayableUi;
    if (ui?.consumeShootRequest()) runtime.touchShootRequested = true;
    originalUpdate.call(this, time);
  };

  trainingPrototype.updateHud = function updateSharedHud(this: TrainingScene): void {
    const runtime = this as unknown as TrainingRuntime;
    if (!runtime.__sharedPlayableUi) {
      // Durante originalCreate todavía existe el HUD histórico.
      originalUpdateHud.call(this);
      return;
    }
    syncSharedHud(this);
  };

  trainingPrototype.shootMagicRay = function shootRayWithSharedUiCamera(this: TrainingScene): void {
    const runtime = this as unknown as TrainingRuntime;
    const before = new Set(this.children.list);
    originalShootMagicRay.call(this);

    const ui = runtime.__sharedPlayableUi;
    if (!ui) return;
    this.children.list
      .filter((child) => !before.has(child))
      .forEach((child) => ui.ignoreWorldObject(child));
  };

  // Los interiores ya trabajan en espacio lógico 960x540 con zoom 2 propio.
}

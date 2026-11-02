import * as Phaser from 'phaser';
import { DEV_MODE } from './devMode';
import { TrainingScene } from './scenes/TrainingScene';
import type { CharacterId } from './gameData';
import { getVillageProgress, setVillageProgressFromTraining } from './villageProgress';

type TrainingPrototype = {
  __devMenuInstalled?: boolean;
  create: (this: TrainingScene) => void;
};

type TrainingRuntime = {
  characterId: CharacterId;
  energy: number;
  coinsCollected: number;
};

export function installDevMenuRefinement(): void {
  if (!DEV_MODE) return;

  const prototype = TrainingScene.prototype as unknown as TrainingPrototype;
  if (prototype.__devMenuInstalled) return;

  const originalCreate = prototype.create;
  prototype.__devMenuInstalled = true;

  prototype.create = function createWithDevMenu(this: TrainingScene): void {
    originalCreate.call(this);

    const menu = this.children.list.find((child) =>
      child instanceof Phaser.GameObjects.Image && child.texture.key === 'training-menu'
    ) as Phaser.GameObjects.Image | undefined;

    if (!menu) return;

    menu.removeAllListeners('pointerdown');
    menu.on('pointerdown', () => {
      const runtime = this as unknown as TrainingRuntime;
      // Al saltar pantallas desde entrenamiento no se ejecuta el portal normal,
      // así que conservamos aquí las monedas y energía ya obtenidas.
      const progress = getVillageProgress();
      const energy = Math.max(0, Math.min(100, runtime.energy));
      const coins = Math.max(progress.coins, runtime.coinsCollected);
      setVillageProgressFromTraining(energy, coins);
      this.registry.set('arkanis.player.energy', energy);
      this.registry.set('arkanis.player.coins', coins);
      this.scene.sleep();
      this.scene.launch('DevMenuScene', {
        sourceSceneKey: this.scene.key,
        characterId: runtime.characterId ?? 'tiana'
      });
    });
  };
}

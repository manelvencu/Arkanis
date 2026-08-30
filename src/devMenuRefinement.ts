import * as Phaser from 'phaser';
import { DEV_MODE } from './devMode';
import { TrainingScene } from './scenes/TrainingScene';
import type { CharacterId } from './gameData';

type TrainingPrototype = {
  __devMenuInstalled?: boolean;
  create: (this: TrainingScene) => void;
};

type TrainingRuntime = {
  characterId: CharacterId;
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
      this.scene.sleep();
      this.scene.launch('DevMenuScene', {
        sourceSceneKey: this.scene.key,
        characterId: runtime.characterId ?? 'tiana'
      });
    });
  };
}

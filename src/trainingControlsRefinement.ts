import * as Phaser from 'phaser';
import { TrainingScene } from './scenes/TrainingScene';

type TrainingPrototype = {
  __touchControlsVisualRefinementInstalled?: boolean;
  create: (this: TrainingScene) => void;
};

export function installTrainingTouchControlsVisualRefinement(): void {
  const prototype = TrainingScene.prototype as unknown as TrainingPrototype;
  if (prototype.__touchControlsVisualRefinementInstalled) return;

  const originalCreate = prototype.create;
  prototype.__touchControlsVisualRefinementInstalled = true;

  prototype.create = function createWithRefinedRayButton(this: TrainingScene): void {
    originalCreate.call(this);

    const magicX = this.scale.width - 105;
    const magicY = this.scale.height - 105;

    const rayLabel = this.children.list.find((child) =>
      child instanceof Phaser.GameObjects.Text && child.text === 'RAYO'
    ) as Phaser.GameObjects.Text | undefined;
    rayLabel?.destroy();

    const rayIcon = this.children.list.find((child) =>
      child instanceof Phaser.GameObjects.Text &&
      child.text === '✦' &&
      Math.abs(child.x - magicX) < 4 &&
      Math.abs(child.y - magicY) < 12
    ) as Phaser.GameObjects.Text | undefined;

    rayIcon?.setPosition(magicX, magicY).setFontSize(31).setColor('#ffe9df');

    const rayButton = this.children.list.find((child) =>
      child instanceof Phaser.GameObjects.Arc &&
      Math.abs(child.x - magicX) < 4 &&
      Math.abs(child.y - magicY) < 4 &&
      child.radius >= 40
    ) as Phaser.GameObjects.Arc | undefined;

    if (!rayButton) return;

    rayButton
      .setRadius(34)
      .setFillStyle(0x7a302d, 0.84)
      .setStrokeStyle(3, 0xf0a08c, 0.98);

    rayButton.on('pointerdown', () => {
      rayButton.setFillStyle(0xa9473b, 0.96);
    });

    const restore = (): void => {
      rayButton.setFillStyle(0x7a302d, 0.84);
    };
    rayButton.on('pointerup', restore);
    rayButton.on('pointerout', restore);
    rayButton.on('pointerupoutside', restore);
  };
}

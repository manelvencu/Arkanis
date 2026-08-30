import * as Phaser from 'phaser';
import { TrainingScene } from './scenes/TrainingScene';

type TouchDirection = 'left' | 'right' | 'up' | 'down';

type TrainingPrototype = {
  __touchControlsVisualRefinementInstalled?: boolean;
  create: (this: TrainingScene) => void;
};

type TrainingRuntime = {
  touchDirections: Record<TouchDirection, boolean>;
};

const HD_SCALE = 2;
const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 540;

export function installTrainingTouchControlsVisualRefinement(): void {
  const prototype = TrainingScene.prototype as unknown as TrainingPrototype;
  if (prototype.__touchControlsVisualRefinementInstalled) return;

  const originalCreate = prototype.create;
  prototype.__touchControlsVisualRefinementInstalled = true;

  prototype.create = function createWithRefinedTouchControls(this: TrainingScene): void {
    originalCreate.call(this);

    const runtime = this as unknown as TrainingRuntime;
    const logicalCenterX = 112;
    const logicalCenterY = LOGICAL_HEIGHT - 108;
    const spacing = 56;
    const centerX = logicalCenterX * HD_SCALE;
    const centerY = logicalCenterY * HD_SCALE;
    const spacingHd = spacing * HD_SCALE;

    const directionLayout: Array<{ label: string; x: number; y: number }> = [
      { label: '◀', x: centerX - spacingHd, y: centerY },
      { label: '▶', x: centerX + spacingHd, y: centerY },
      { label: '▲', x: centerX, y: centerY - spacingHd },
      { label: '▼', x: centerX, y: centerY + spacingHd }
    ];

    directionLayout.forEach(({ label, x, y }) => {
      const text = this.children.list.find((child) =>
        child instanceof Phaser.GameObjects.Text && child.text === label
      ) as Phaser.GameObjects.Text | undefined;
      text?.setPosition(x, y).setScale(HD_SCALE).setScrollFactor(0);
    });

    const directionButtons = this.children.list.filter((child) =>
      child instanceof Phaser.GameObjects.Arc &&
      child.radius <= 30
    ) as Phaser.GameObjects.Arc[];

    const buttonTargets = [
      { x: centerX - spacingHd, y: centerY },
      { x: centerX + spacingHd, y: centerY },
      { x: centerX, y: centerY - spacingHd },
      { x: centerX, y: centerY + spacingHd }
    ];

    directionButtons.slice(0, 4).forEach((button, index) => {
      const target = buttonTargets[index];
      button.setPosition(target.x, target.y).setRadius(25 * HD_SCALE).setScrollFactor(0);
      button.setStrokeStyle(3 * HD_SCALE, 0xf1d16a, 0.9);
    });

    const magicX = (LOGICAL_WIDTH - 105) * HD_SCALE;
    const magicY = (LOGICAL_HEIGHT - 105) * HD_SCALE;

    const rayLabel = this.children.list.find((child) =>
      child instanceof Phaser.GameObjects.Text && child.text === 'RAYO'
    ) as Phaser.GameObjects.Text | undefined;
    rayLabel?.destroy();

    const rayIcon = this.children.list.find((child) =>
      child instanceof Phaser.GameObjects.Text && child.text === '✦'
    ) as Phaser.GameObjects.Text | undefined;
    rayIcon?.setPosition(magicX, magicY).setFontSize(31).setScale(HD_SCALE).setColor('#ffe9df').setScrollFactor(0);

    const rayButton = this.children.list.find((child) =>
      child instanceof Phaser.GameObjects.Arc && child.radius >= 40
    ) as Phaser.GameObjects.Arc | undefined;

    if (rayButton) {
      rayButton
        .setPosition(magicX, magicY)
        .setRadius(34 * HD_SCALE)
        .setFillStyle(0x7a302d, 0.84)
        .setStrokeStyle(3 * HD_SCALE, 0xf0a08c, 0.98)
        .setScrollFactor(0);

      rayButton.on('pointerdown', () => {
        rayButton.setFillStyle(0xa9473b, 0.96);
      });
      const restore = (): void => {
        rayButton.setFillStyle(0x7a302d, 0.84);
      };
      rayButton.on('pointerup', restore);
      rayButton.on('pointerout', restore);
      rayButton.on('pointerupoutside', restore);
    }

    let dpadPointerId: number | null = null;

    const clearDirections = (): void => {
      runtime.touchDirections.left = false;
      runtime.touchDirections.right = false;
      runtime.touchDirections.up = false;
      runtime.touchDirections.down = false;
    };

    const updateDirectionFromPointer = (pointer: Phaser.Input.Pointer): void => {
      const dx = pointer.x - centerX;
      const dy = pointer.y - centerY;
      const deadZone = 18 * HD_SCALE;

      clearDirections();
      if (Math.abs(dx) > deadZone) runtime.touchDirections[dx < 0 ? 'left' : 'right'] = true;
      if (Math.abs(dy) > deadZone) runtime.touchDirections[dy < 0 ? 'up' : 'down'] = true;
    };

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (Phaser.Math.Distance.Between(pointer.x, pointer.y, centerX, centerY) <= 100 * HD_SCALE) {
        dpadPointerId = pointer.id;
        updateDirectionFromPointer(pointer);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== dpadPointerId || !pointer.isDown) return;
      updateDirectionFromPointer(pointer);
    });

    const releaseDpad = (pointer: Phaser.Input.Pointer): void => {
      if (pointer.id !== dpadPointerId) return;
      dpadPointerId = null;
      clearDirections();
    };

    this.input.on('pointerup', releaseDpad);
    this.input.on('pointerupoutside', releaseDpad);
  };
}

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

const LOGICAL_HEIGHT = 540;
const HD_SCALE = 2;

export function installTrainingTouchControlsVisualRefinement(): void {
  const prototype = TrainingScene.prototype as unknown as TrainingPrototype;
  if (prototype.__touchControlsVisualRefinementInstalled) return;

  const originalCreate = prototype.create;
  prototype.__touchControlsVisualRefinementInstalled = true;

  prototype.create = function createWithRefinedTouchControls(this: TrainingScene): void {
    originalCreate.call(this);

    const runtime = this as unknown as TrainingRuntime;
    const originalCenterX = 112;
    const originalCenterY = this.scale.height - 108;
    const logicalCenterX = 112;
    const logicalCenterY = LOGICAL_HEIGHT - 108;
    const spacing = 56;

    const directionLayout: Array<{ label: string; x: number; y: number }> = [
      { label: '◀', x: logicalCenterX - spacing, y: logicalCenterY },
      { label: '▶', x: logicalCenterX + spacing, y: logicalCenterY },
      { label: '▲', x: logicalCenterX, y: logicalCenterY - spacing },
      { label: '▼', x: logicalCenterX, y: logicalCenterY + spacing }
    ];

    directionLayout.forEach(({ label, x, y }) => {
      const text = this.children.list.find((child) =>
        child instanceof Phaser.GameObjects.Text && child.text === label
      ) as Phaser.GameObjects.Text | undefined;
      text?.setPosition(x, y);
    });

    const directionButtons = this.children.list.filter((child) =>
      child instanceof Phaser.GameObjects.Arc &&
      child.radius <= 30 &&
      Math.abs(child.x - originalCenterX) <= spacing + 5 &&
      Math.abs(child.y - originalCenterY) <= spacing + 5
    ) as Phaser.GameObjects.Arc[];

    const buttonTargets = [
      { x: logicalCenterX - spacing, y: logicalCenterY },
      { x: logicalCenterX + spacing, y: logicalCenterY },
      { x: logicalCenterX, y: logicalCenterY - spacing },
      { x: logicalCenterX, y: logicalCenterY + spacing }
    ];

    directionButtons.forEach((button) => {
      const nearest = buttonTargets.reduce((best, target) => {
        const originalTarget = {
          x: target.x,
          y: target.y + (originalCenterY - logicalCenterY)
        };
        const distance = Phaser.Math.Distance.Between(button.x, button.y, originalTarget.x, originalTarget.y);
        return distance < best.distance ? { target, distance } : best;
      }, { target: buttonTargets[0], distance: Number.POSITIVE_INFINITY });
      button.setPosition(nearest.target.x, nearest.target.y);
    });

    const originalMagicX = this.scale.width - 105;
    const originalMagicY = this.scale.height - 105;
    const magicX = 960 - 105;
    const magicY = LOGICAL_HEIGHT - 105;

    const rayLabel = this.children.list.find((child) =>
      child instanceof Phaser.GameObjects.Text && child.text === 'RAYO'
    ) as Phaser.GameObjects.Text | undefined;
    rayLabel?.destroy();

    const rayIcon = this.children.list.find((child) =>
      child instanceof Phaser.GameObjects.Text &&
      child.text === '✦' &&
      Math.abs(child.x - originalMagicX) < 8 &&
      Math.abs(child.y - originalMagicY) < 16
    ) as Phaser.GameObjects.Text | undefined;

    rayIcon?.setPosition(magicX, magicY).setFontSize(31).setColor('#ffe9df');

    const rayButton = this.children.list.find((child) =>
      child instanceof Phaser.GameObjects.Arc &&
      Math.abs(child.x - originalMagicX) < 8 &&
      Math.abs(child.y - originalMagicY) < 8 &&
      child.radius >= 40
    ) as Phaser.GameObjects.Arc | undefined;

    if (rayButton) {
      rayButton
        .setPosition(magicX, magicY)
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
    }

    let dpadPointerId: number | null = null;

    const clearDirections = (): void => {
      runtime.touchDirections.left = false;
      runtime.touchDirections.right = false;
      runtime.touchDirections.up = false;
      runtime.touchDirections.down = false;
    };

    const updateDirectionFromPointer = (pointer: Phaser.Input.Pointer): void => {
      const x = pointer.x / HD_SCALE;
      const y = pointer.y / HD_SCALE;
      const dx = x - logicalCenterX;
      const dy = y - logicalCenterY;
      const deadZone = 18;

      clearDirections();
      if (Math.abs(dx) > deadZone) runtime.touchDirections[dx < 0 ? 'left' : 'right'] = true;
      if (Math.abs(dy) > deadZone) runtime.touchDirections[dy < 0 ? 'up' : 'down'] = true;
    };

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const x = pointer.x / HD_SCALE;
      const y = pointer.y / HD_SCALE;
      if (Phaser.Math.Distance.Between(x, y, logicalCenterX, logicalCenterY) <= 100) {
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

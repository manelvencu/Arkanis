import { TrainingScene } from './scenes/TrainingScene';

type TrainingAnimationPrototype = {
  __tianaSideWalkRefinementInstalled?: boolean;
  createTianaAnimations: (this: TrainingScene) => void;
};

export function installTianaSideWalkRefinement(): void {
  const prototype = TrainingScene.prototype as unknown as TrainingAnimationPrototype;
  if (prototype.__tianaSideWalkRefinementInstalled) return;

  const originalCreateTianaAnimations = prototype.createTianaAnimations;
  prototype.__tianaSideWalkRefinementInstalled = true;

  prototype.createTianaAnimations = function createTianaAnimationsWithClearerSideStep(this: TrainingScene): void {
    originalCreateTianaAnimations.call(this);

    if (this.anims.exists('tiana-walk-side')) {
      this.anims.remove('tiana-walk-side');
    }

    this.anims.create({
      key: 'tiana-walk-side',
      frames: [
        { key: 'tiana-walk-right-01' },
        { key: 'tiana-idle-right' },
        { key: 'tiana-walk-right-02' },
        { key: 'tiana-idle-right' }
      ],
      frameRate: 8,
      repeat: -1
    });
  };
}

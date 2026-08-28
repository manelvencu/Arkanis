import * as Phaser from 'phaser';
import { TrainingScene } from './scenes/TrainingScene';

type TrainingPrototype = {
  __cabinOneTransitionInstalled?: boolean;
  update: (this: TrainingScene, time: number) => void;
};

type TrainingRuntime = {
  characterId: 'tiana' | 'lupe';
  player: Phaser.Physics.Arcade.Sprite;
  __cabinTransitioning?: boolean;
  __cabin1Transitioning?: boolean;
};

const CABINS = [
  { x: 368, sceneKey: 'CabinOneScene' },
  { x: 688, sceneKey: 'CabinTwoScene' },
  { x: 1008, sceneKey: 'CabinThreeScene' }
] as const;

export function installCabinOneTransitionRefinement(): void {
  const prototype = TrainingScene.prototype as unknown as TrainingPrototype;
  if (prototype.__cabinOneTransitionInstalled) return;

  const originalUpdate = prototype.update;
  prototype.__cabinOneTransitionInstalled = true;

  prototype.update = function updateWithCabinEntry(this: TrainingScene, time: number): void {
    originalUpdate.call(this, time);

    const runtime = this as unknown as TrainingRuntime;
    if (!runtime.player?.active || runtime.__cabinTransitioning || runtime.__cabin1Transitioning) return;

    const body = runtime.player.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y >= -1 || runtime.player.y < 300 || runtime.player.y > 365) return;

    const cabin = CABINS.find(({ x }) => Math.abs(runtime.player.x - x) <= 42);
    if (!cabin) return;

    runtime.__cabinTransitioning = true;
    runtime.__cabin1Transitioning = true;
    body.setVelocity(0);
    this.cameras.main.fadeOut(240, 18, 12, 8);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.launch(cabin.sceneKey, { characterId: runtime.characterId });
      this.scene.sleep();
    });
  };
}

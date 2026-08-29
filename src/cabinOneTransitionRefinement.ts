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

const GRID_SIZE = 32;
const CABINS = [
  { column: 12, row: 10, sceneKey: 'CabinOneScene' },
  { column: 22, row: 10, sceneKey: 'CabinTwoScene' },
  { column: 32, row: 10, sceneKey: 'CabinThreeScene' }
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
    if (body.velocity.y >= -1) return;

    const cabin = CABINS.find(({ column, row }) => {
      const left = (column - 1) * GRID_SIZE;
      const right = left + GRID_SIZE;
      const top = (row - 1) * GRID_SIZE;
      const bottom = top + GRID_SIZE;

      return runtime.player.x >= left
        && runtime.player.x < right
        && runtime.player.y >= top
        && runtime.player.y < bottom;
    });
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

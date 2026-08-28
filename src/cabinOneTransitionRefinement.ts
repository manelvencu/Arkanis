import { TrainingScene } from './scenes/TrainingScene';

type TrainingPrototype = {
  __cabinOneTransitionInstalled?: boolean;
  update: (this: TrainingScene, time: number) => void;
};

type TrainingRuntime = {
  characterId: 'tiana' | 'lupe';
  player: Phaser.Physics.Arcade.Sprite;
  __cabin1Transitioning?: boolean;
};

export function installCabinOneTransitionRefinement(): void {
  const prototype = TrainingScene.prototype as unknown as TrainingPrototype;
  if (prototype.__cabinOneTransitionInstalled) return;

  const originalUpdate = prototype.update;
  prototype.__cabinOneTransitionInstalled = true;

  prototype.update = function updateWithCabinEntry(this: TrainingScene, time: number): void {
    originalUpdate.call(this, time);

    const runtime = this as unknown as TrainingRuntime;
    if (!runtime.player?.active || runtime.__cabin1Transitioning) return;

    const body = runtime.player.body as Phaser.Physics.Arcade.Body;
    const atFirstCabinDoor =
      runtime.player.x >= 330 &&
      runtime.player.x <= 410 &&
      runtime.player.y >= 300 &&
      runtime.player.y <= 365 &&
      body.velocity.y < -1;

    if (!atFirstCabinDoor) return;

    runtime.__cabin1Transitioning = true;
    body.setVelocity(0);
    this.cameras.main.fadeOut(240, 18, 12, 8);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.launch('CabinOneScene', { characterId: runtime.characterId });
      this.scene.sleep();
    });
  };
}

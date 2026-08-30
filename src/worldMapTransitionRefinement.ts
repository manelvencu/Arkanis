import * as Phaser from 'phaser';
import { TrainingScene } from './scenes/TrainingScene';

type TrainingPrototype = {
  __worldMapTransitionInstalled?: boolean;
  checkExit: (this: TrainingScene) => void;
};

type TrainingRuntime = {
  exitUnlocked: boolean;
  isExiting: boolean;
  player: Phaser.Physics.Arcade.Sprite;
  barrier: Phaser.Physics.Arcade.Image;
  characterId: string;
};

export function installWorldMapTransitionRefinement(): void {
  const prototype = TrainingScene.prototype as unknown as TrainingPrototype;
  if (prototype.__worldMapTransitionInstalled) return;

  prototype.__worldMapTransitionInstalled = true;
  prototype.checkExit = function checkExitToWorldMap(this: TrainingScene): void {
    const runtime = this as unknown as TrainingRuntime;
    if (!runtime.exitUnlocked || runtime.isExiting) return;

    const body = runtime.player.body as Phaser.Physics.Arcade.Body;
    const insidePortal = Phaser.Geom.Rectangle.Contains(
      new Phaser.Geom.Rectangle(runtime.barrier.x - 60, runtime.barrier.y - 48, 120, 96),
      runtime.player.x,
      runtime.player.y
    );

    if (!insidePortal || body.velocity.y >= 0) return;

    runtime.isExiting = true;
    body.setVelocity(0);
    runtime.player.anims.stop();
    this.cameras.main.fadeOut(750, 3, 2, 8);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.physics.pause();
      this.scene.start('WorldMapScene', { characterId: runtime.characterId });
    });
  };
}

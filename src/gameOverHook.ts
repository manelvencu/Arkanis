import type * as Phaser from 'phaser';
import type { CharacterId } from './gameData';
import { TrainingScene } from './scenes/TrainingScene';

type TrainingRuntime = Phaser.Scene & {
  energy: number;
  lastSpikeHitAt: number;
  isExiting: boolean;
  characterId: CharacterId;
  player: Phaser.Physics.Arcade.Sprite;
  updateHud: () => void;
};

type TrainingPrototype = {
  __gameOverHookInstalled?: boolean;
  hitSpikes: (this: TrainingRuntime) => void;
};

export function installTrainingGameOverHook(): void {
  const prototype = TrainingScene.prototype as unknown as TrainingPrototype;

  if (prototype.__gameOverHookInstalled) return;
  prototype.__gameOverHookInstalled = true;

  prototype.hitSpikes = function hitSpikesWithGameOver(this: TrainingRuntime): void {
    const now = this.time.now;
    if (now - this.lastSpikeHitAt < 1200 || this.isExiting) return;

    this.lastSpikeHitAt = now;
    this.energy = Math.max(0, this.energy - 20);
    this.cameras.main.shake(180, 0.007);
    this.player.setTint(0xff5544);
    this.time.delayedCall(180, () => this.player.clearTint());
    this.updateHud();

    if (this.energy !== 0) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);
    this.player.anims.stop();

    this.scene.launch('GameOverScene', { characterId: this.characterId });
    this.scene.pause();
  };
}

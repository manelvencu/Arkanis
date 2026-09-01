import * as Phaser from 'phaser';
import { AldeaScene } from './scenes/AldeaScene';
import type { CharacterId } from './gameData';

type AldeaRuntime = Phaser.Scene & {
  player: Phaser.Physics.Arcade.Sprite;
  characterId: CharacterId;
  exitStarted: boolean;
  __churchTransitioning?: boolean;
};

type AldeaPrototype = {
  __churchEntranceRefinementInstalled?: boolean;
  init: (this: AldeaRuntime, data: unknown) => void;
  update: (this: AldeaRuntime, time: number, delta: number) => void;
};

const CHURCH_DOOR = new Phaser.Math.Vector2(592, 238);
const CHURCH_TRIGGER_RADIUS = 54;

export function installChurchEntranceRefinement(): void {
  const prototype = AldeaScene.prototype as unknown as AldeaPrototype;
  if (prototype.__churchEntranceRefinementInstalled) return;
  prototype.__churchEntranceRefinementInstalled = true;

  const originalInit = prototype.init;
  const originalUpdate = prototype.update;

  prototype.init = function initChurchEntrance(this: AldeaRuntime, data: unknown): void {
    originalInit.call(this, data);
    this.__churchTransitioning = false;
  };

  prototype.update = function updateChurchEntrance(this: AldeaRuntime, time: number, delta: number): void {
    originalUpdate.call(this, time, delta);

    if (this.__churchTransitioning || this.exitStarted || !this.scene.isActive()) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body || body.velocity.y >= -5) return;

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      CHURCH_DOOR.x,
      CHURCH_DOOR.y
    );
    if (distance > CHURCH_TRIGGER_RADIUS) return;

    this.__churchTransitioning = true;
    body.setVelocity(0);
    this.player.anims.stop();
    this.cameras.main.fadeOut(260, 18, 12, 8);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('ChurchInteriorScene', {
        characterId: this.characterId,
        returnX: CHURCH_DOOR.x,
        returnY: CHURCH_DOOR.y + 42
      });
    });
  };
}

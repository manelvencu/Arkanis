import * as Phaser from 'phaser';
import { AldeaScene } from './scenes/AldeaScene';
import type { CharacterId } from './gameData';

type AldeaData = {
  characterId?: CharacterId;
  returnX?: number;
  returnY?: number;
};

type AldeaRuntime = Phaser.Scene & {
  player: Phaser.Physics.Arcade.Sprite;
  characterId: CharacterId;
  exitStarted: boolean;
  facing: 'down' | 'up' | 'side';
  direction: Phaser.Math.Vector2;
  worldColliders: Phaser.GameObjects.Rectangle[];
  __churchTransitioning?: boolean;
  __churchReturnFacingDown?: boolean;
};

type AldeaPrototype = {
  __churchEntranceRefinementInstalled?: boolean;
  init: (this: AldeaRuntime, data: AldeaData) => void;
  create: (this: AldeaRuntime) => void;
  update: (this: AldeaRuntime, time: number, delta: number) => void;
};

const GRID = 32;
const CHURCH_X = (19 - 0.5) * GRID;
const CHURCH_BLOCKER_Y = 112;
const CHURCH_WIDTH = 240;
const CHURCH_HEIGHT = 224;
const CHURCH_ENTRY = new Phaser.Geom.Rectangle((18 - 1) * GRID, (7 - 1) * GRID, 2 * GRID, GRID);
const CHURCH_RETURN = new Phaser.Math.Vector2((18 - 0.5) * GRID, (8 - 0.5) * GRID);

function replaceChurchBlocker(scene: AldeaRuntime): void {
  const oldBlocker = scene.worldColliders.find((blocker) =>
    Math.abs(blocker.x - CHURCH_X) < 1 &&
    Math.abs(blocker.y - CHURCH_BLOCKER_Y) < 1 &&
    Math.abs(blocker.width - CHURCH_WIDTH) < 1 &&
    Math.abs(blocker.height - CHURCH_HEIGHT) < 1
  );

  if (oldBlocker) {
    scene.worldColliders = scene.worldColliders.filter((blocker) => blocker !== oldBlocker);
    oldBlocker.destroy();
  }

  const addBlocker = (x: number, y: number, width: number, height: number): void => {
    const blocker = scene.add.rectangle(x, y, width, height, 0x000000, 0);
    scene.physics.add.existing(blocker, true);
    scene.physics.add.collider(scene.player, blocker);
    scene.worldColliders.push(blocker);
  };

  // La iglesia sigue bloqueada salvo exactamente en C18/F7 y C19/F7.
  addBlocker(CHURCH_X, 96, CHURCH_WIDTH, 192);
  addBlocker(508, 208, 72, 32);
  addBlocker(660, 208, 104, 32);
}

export function installChurchEntranceRefinement(): void {
  const prototype = AldeaScene.prototype as unknown as AldeaPrototype;
  if (prototype.__churchEntranceRefinementInstalled) return;
  prototype.__churchEntranceRefinementInstalled = true;

  const originalInit = prototype.init;
  const originalCreate = prototype.create;
  const originalUpdate = prototype.update;

  prototype.init = function initChurchEntrance(this: AldeaRuntime, data: AldeaData): void {
    originalInit.call(this, data);
    this.__churchTransitioning = false;
    this.__churchReturnFacingDown = data.returnX === CHURCH_RETURN.x && data.returnY === CHURCH_RETURN.y;
  };

  prototype.create = function createChurchEntrance(this: AldeaRuntime): void {
    originalCreate.call(this);
    replaceChurchBlocker(this);

    if (this.__churchReturnFacingDown) {
      this.facing = 'down';
      this.direction.set(0, 1);
      this.player.anims.stop();
      this.player.setFlipX(false);
      this.player.setTexture('aldea-player-down');
    }
  };

  prototype.update = function updateChurchEntrance(this: AldeaRuntime, time: number, delta: number): void {
    originalUpdate.call(this, time, delta);

    if (this.__churchTransitioning || this.exitStarted || !this.scene.isActive()) return;

    const footX = this.player.x;
    const footY = this.player.y + 20;
    if (!Phaser.Geom.Rectangle.Contains(CHURCH_ENTRY, footX, footY)) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    this.__churchTransitioning = true;
    body.setVelocity(0);
    this.player.anims.stop();
    this.cameras.main.fadeOut(260, 18, 12, 8);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('ChurchInteriorScene', {
        characterId: this.characterId,
        returnX: CHURCH_RETURN.x,
        returnY: CHURCH_RETURN.y
      });
    });
  };
}

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
  __returningFromChurch?: boolean;
};

type AldeaPrototype = {
  __churchEntranceRefinementInstalled?: boolean;
  init: (this: AldeaRuntime, data: AldeaData) => void;
  create: (this: AldeaRuntime) => void;
  update: (this: AldeaRuntime, time: number, delta: number) => void;
};

const GRID = 32;
const CHURCH_TRIGGER = new Phaser.Geom.Rectangle((18 - 1) * GRID, (7 - 1) * GRID, GRID * 2, GRID);
const CHURCH_RETURN = new Phaser.Math.Vector2((18 - 0.5) * GRID, (8 - 0.5) * GRID);
const CHURCH_CENTER_X = (19 - 0.5) * GRID;
const CHURCH_BASE_Y = 7 * GRID;
const CHURCH_WIDTH = 240;
const CHURCH_HEIGHT = 224;

function replaceChurchBlocker(scene: AldeaRuntime): void {
  const churchBlocker = scene.worldColliders.find((blocker) => {
    const body = blocker.body as Phaser.Physics.Arcade.StaticBody | null;
    return Boolean(
      body
      && Math.abs(blocker.x - CHURCH_CENTER_X) < 1
      && Math.abs(blocker.y - (CHURCH_BASE_Y - CHURCH_HEIGHT / 2)) < 1
      && Math.abs(blocker.width - CHURCH_WIDTH) < 1
      && Math.abs(blocker.height - CHURCH_HEIGHT) < 1
    );
  });

  if (!churchBlocker) return;

  scene.worldColliders = scene.worldColliders.filter((blocker) => blocker !== churchBlocker);
  churchBlocker.destroy();

  const leftEdge = CHURCH_CENTER_X - CHURCH_WIDTH / 2;
  const rightEdge = CHURCH_CENTER_X + CHURCH_WIDTH / 2;
  const doorLeft = CHURCH_TRIGGER.left;
  const doorRight = CHURCH_TRIGGER.right;
  const doorTop = CHURCH_TRIGGER.top;

  const addBlocker = (x: number, y: number, width: number, height: number): void => {
    const blocker = scene.add.rectangle(x, y, width, height, 0x000000, 0);
    scene.physics.add.existing(blocker, true);
    scene.physics.add.collider(scene.player, blocker);
    scene.worldColliders.push(blocker);
  };

  // Parte superior de la iglesia: permanece sólida hasta justo encima de F7.
  addBlocker(CHURCH_CENTER_X, doorTop / 2, CHURCH_WIDTH, doorTop);

  // F7 queda abierta únicamente en C18 y C19.
  const leftWidth = doorLeft - leftEdge;
  if (leftWidth > 0) addBlocker(leftEdge + leftWidth / 2, doorTop + GRID / 2, leftWidth, GRID);

  const rightWidth = rightEdge - doorRight;
  if (rightWidth > 0) addBlocker(doorRight + rightWidth / 2, doorTop + GRID / 2, rightWidth, GRID);
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
    this.__returningFromChurch = data.returnX === CHURCH_RETURN.x && data.returnY === CHURCH_RETURN.y;
  };

  prototype.create = function createChurchEntrance(this: AldeaRuntime): void {
    originalCreate.call(this);
    replaceChurchBlocker(this);

    if (this.__returningFromChurch) {
      this.player.setPosition(CHURCH_RETURN.x, CHURCH_RETURN.y);
      this.player.anims.stop();
      this.player.setTexture('aldea-player-down');
      this.player.setFlipX(false);
      this.facing = 'down';
      this.direction.set(0, 1);
    }
  };

  prototype.update = function updateChurchEntrance(this: AldeaRuntime, time: number, delta: number): void {
    originalUpdate.call(this, time, delta);

    if (this.__churchTransitioning || this.exitStarted || !this.scene.isActive()) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body || body.velocity.y >= -5) return;

    const footX = this.player.x;
    const footY = this.player.y + 20;
    if (!Phaser.Geom.Rectangle.Contains(CHURCH_TRIGGER, footX, footY)) return;

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

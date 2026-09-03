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
  walkableAreas: Phaser.Geom.Rectangle[];
  __churchTransitioning?: boolean;
  __returningFromChurch?: boolean;
  __churchReturnGuard?: boolean;
};

type AldeaPrototype = {
  __churchEntranceRefinementInstalled?: boolean;
  init: (this: AldeaRuntime, data: AldeaData) => void;
  create: (this: AldeaRuntime) => void;
  update: (this: AldeaRuntime, time: number, delta: number) => void;
};

const GRID = 32;
// La entrada lógica se baja una fila: C18/F8 y C19/F8. Así la transición se dispara
// delante de la fachada, antes de que el cuerpo del personaje alcance el collider de la iglesia.
const CHURCH_TRIGGER = new Phaser.Geom.Rectangle((18 - 1) * GRID, (8 - 1) * GRID, GRID * 2, GRID);
const CHURCH_RETURN = new Phaser.Math.Vector2((18 - 0.5) * GRID, (8 - 0.5) * GRID);
const CHURCH_CENTER_X = (19 - 0.5) * GRID;
const CHURCH_BASE_Y = 7 * GRID;
const CHURCH_WIDTH = 240;
const CHURCH_HEIGHT = 224;

// El hueco físico sigue siendo algo más ancho que la entrada lógica para evitar roces visuales.
const PHYSICAL_DOOR_LEFT = (18 - 1) * GRID - GRID / 2;
const PHYSICAL_DOOR_RIGHT = (20 - 1) * GRID + GRID / 2;
const PHYSICAL_DOOR_TOP = (7 - 1) * GRID - GRID / 2;

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

  if (churchBlocker) {
    scene.worldColliders = scene.worldColliders.filter((blocker) => blocker !== churchBlocker);
    churchBlocker.destroy();
  }

  const leftEdge = CHURCH_CENTER_X - CHURCH_WIDTH / 2;
  const rightEdge = CHURCH_CENTER_X + CHURCH_WIDTH / 2;

  const addBlocker = (x: number, y: number, width: number, height: number): void => {
    if (width <= 0 || height <= 0) return;
    const blocker = scene.add.rectangle(x, y, width, height, 0x000000, 0);
    scene.physics.add.existing(blocker, true);
    scene.physics.add.collider(scene.player, blocker);
    scene.worldColliders.push(blocker);
  };

  addBlocker(CHURCH_CENTER_X, PHYSICAL_DOOR_TOP / 2, CHURCH_WIDTH, PHYSICAL_DOOR_TOP);

  const doorwayHeight = CHURCH_BASE_Y - PHYSICAL_DOOR_TOP;
  const leftWidth = PHYSICAL_DOOR_LEFT - leftEdge;
  addBlocker(leftEdge + leftWidth / 2, PHYSICAL_DOOR_TOP + doorwayHeight / 2, leftWidth, doorwayHeight);

  const rightWidth = rightEdge - PHYSICAL_DOOR_RIGHT;
  addBlocker(PHYSICAL_DOOR_RIGHT + rightWidth / 2, PHYSICAL_DOOR_TOP + doorwayHeight / 2, rightWidth, doorwayHeight);

  // Corredor transitable que enlaza la plaza con la nueva fila de entrada F8.
  scene.walkableAreas.push(new Phaser.Geom.Rectangle(
    PHYSICAL_DOOR_LEFT,
    PHYSICAL_DOOR_TOP,
    PHYSICAL_DOOR_RIGHT - PHYSICAL_DOOR_LEFT,
    CHURCH_TRIGGER.bottom - PHYSICAL_DOOR_TOP + GRID
  ));
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
    this.__churchReturnGuard = this.__returningFromChurch;
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
    if (!body) return;

    const footX = this.player.x;
    const footY = this.player.y + 20;
    const insideTrigger = Phaser.Geom.Rectangle.Contains(CHURCH_TRIGGER, footX, footY);

    // Al volver de la iglesia aparecemos en C18/F8. No permitimos reentrar instantáneamente:
    // primero hay que abandonar esa celda y después ya queda rearmado el acceso.
    if (this.__churchReturnGuard) {
      if (!insideTrigger) this.__churchReturnGuard = false;
      return;
    }

    if (!insideTrigger) return;

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

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
const CHURCH_CENTER_X = (19 - 0.5) * GRID; // 592
const CHURCH_BASE_Y = 7 * GRID; // 224
const CHURCH_WIDTH = 240;
const CHURCH_HEIGHT = 224;

// La aproximación a la iglesia queda expresamente transitable desde la plaza hasta la fachada.
// Es más ancha que el hueco visual para que el cuerpo físico del personaje no roce con ningún
// borde heredado del edificio o de la antigua franja de tierra.
const CHURCH_APPROACH = new Phaser.Geom.Rectangle(
  CHURCH_CENTER_X - GRID * 2,
  CHURCH_BASE_Y - GRID * 2,
  GRID * 4,
  GRID * 4
);

// Disparamos la transición ANTES de que el cuerpo llegue a tocar la fachada. La zona cubre
// el tramo final de aproximación (F8 y parte de F9), centrado en la puerta de la iglesia.
const CHURCH_TRIGGER = new Phaser.Geom.Rectangle(
  CHURCH_CENTER_X - GRID,
  CHURCH_BASE_Y + 4,
  GRID * 2,
  GRID * 2
);

const CHURCH_RETURN = new Phaser.Math.Vector2((18 - 0.5) * GRID, (8 - 0.5) * GRID);

// Hueco físico amplio en el centro de la fachada.
const PHYSICAL_DOOR_LEFT = CHURCH_CENTER_X - GRID * 1.5;
const PHYSICAL_DOOR_RIGHT = CHURCH_CENTER_X + GRID * 1.5;
const PHYSICAL_DOOR_TOP = CHURCH_BASE_Y - GRID * 2;

function blockerBounds(blocker: Phaser.GameObjects.Rectangle): Phaser.Geom.Rectangle {
  return new Phaser.Geom.Rectangle(
    blocker.x - blocker.width / 2,
    blocker.y - blocker.height / 2,
    blocker.width,
    blocker.height
  );
}

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

  // Limpieza defensiva: si algún refinamiento anterior dejó un collider invisible justo en el
  // acceso central, lo retiramos. Solo afectamos al corredor estrecho frente a la puerta.
  const doorwayClearance = new Phaser.Geom.Rectangle(
    PHYSICAL_DOOR_LEFT,
    PHYSICAL_DOOR_TOP,
    PHYSICAL_DOOR_RIGHT - PHYSICAL_DOOR_LEFT,
    CHURCH_BASE_Y - PHYSICAL_DOOR_TOP + GRID * 2
  );

  scene.worldColliders.slice().forEach((blocker) => {
    if (!blocker.active) return;
    if (!Phaser.Geom.Intersects.RectangleToRectangle(blockerBounds(blocker), doorwayClearance)) return;
    scene.worldColliders = scene.worldColliders.filter((item) => item !== blocker);
    blocker.destroy();
  });

  const leftEdge = CHURCH_CENTER_X - CHURCH_WIDTH / 2;
  const rightEdge = CHURCH_CENTER_X + CHURCH_WIDTH / 2;

  const addBlocker = (x: number, y: number, width: number, height: number): void => {
    if (width <= 0 || height <= 0) return;
    const blocker = scene.add.rectangle(x, y, width, height, 0x000000, 0);
    scene.physics.add.existing(blocker, true);
    scene.physics.add.collider(scene.player, blocker);
    scene.worldColliders.push(blocker);
  };

  // Cuerpo de la iglesia por encima del hueco.
  addBlocker(CHURCH_CENTER_X, PHYSICAL_DOOR_TOP / 2, CHURCH_WIDTH, PHYSICAL_DOOR_TOP);

  // Laterales sólidos, dejando libre por completo el corredor central.
  const doorwayHeight = CHURCH_BASE_Y - PHYSICAL_DOOR_TOP;
  const leftWidth = PHYSICAL_DOOR_LEFT - leftEdge;
  addBlocker(leftEdge + leftWidth / 2, PHYSICAL_DOOR_TOP + doorwayHeight / 2, leftWidth, doorwayHeight);

  const rightWidth = rightEdge - PHYSICAL_DOOR_RIGHT;
  addBlocker(PHYSICAL_DOOR_RIGHT + rightWidth / 2, PHYSICAL_DOOR_TOP + doorwayHeight / 2, rightWidth, doorwayHeight);

  // El sistema base de Aldea solo permite caminar por rectángulos registrados en walkableAreas.
  // Registramos explícitamente toda la zona de tierra/retranqueo de la iglesia como transitable.
  scene.walkableAreas.push(new Phaser.Geom.Rectangle(
    CHURCH_APPROACH.x,
    CHURCH_APPROACH.y,
    CHURCH_APPROACH.width,
    CHURCH_APPROACH.height
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

    // Usamos el centro del personaje para que la transición ocurra antes de que su cuerpo físico
    // pueda tocar la fachada. No dependemos de la velocidad ni de penetrar en el edificio.
    const insideTrigger = Phaser.Geom.Rectangle.Contains(CHURCH_TRIGGER, this.player.x, this.player.y);

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

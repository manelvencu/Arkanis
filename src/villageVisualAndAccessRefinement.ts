import * as Phaser from 'phaser';
import { AldeaScene } from './scenes/AldeaScene';
import { VillageCabinScene } from './scenes/VillageCabinScene';
import type { CharacterId } from './gameData';

type NpcHolder = {
  sprite: Phaser.Physics.Arcade.Sprite;
};

type AldeaRuntime = Phaser.Scene & {
  player: Phaser.Physics.Arcade.Sprite;
  characterId: CharacterId;
  ui: {
    ignoreWorldObject: (object: Phaser.GameObjects.GameObject) => void;
  };
  walkableAreas: Phaser.Geom.Rectangle[];
  __villageNpcs?: NpcHolder[];
  __c26CabinTransitioning?: boolean;
};

type AldeaPrototype = {
  __villageVisualAndAccessRefinementInstalled?: boolean;
  init: (this: AldeaRuntime, data: unknown) => void;
  create: (this: AldeaRuntime) => void;
  update: (this: AldeaRuntime, time: number, delta: number) => void;
};

type CabinRuntime = Phaser.Scene;

type CabinPrototype = {
  __woodFloorRefinementInstalled?: boolean;
  create: (this: CabinRuntime) => void;
  checkCoinCollection: (this: CabinRuntime) => void;
};

const C26_DOOR = new Phaser.Math.Vector2(816, 456);
const C26_TRIGGER_RADIUS = 74;

// Nuevo camino solicitado:
// - vertical: C25-C27 desde F15 hasta F22;
// - horizontal: por F21-F22 hacia la izquierda hasta enlazar con el camino existente.
const C26_SOUTH_VERTICAL = new Phaser.Geom.Rectangle(768, 448, 96, 256);
const C26_SOUTH_HORIZONTAL = new Phaser.Geom.Rectangle(560, 640, 256, 64);

function addC26SouthRoad(scene: AldeaRuntime): void {
  const dirtSource = scene.textures.get('aldea-dirt').getSourceImage() as { width: number; height: number };
  const tileScaleX = 128 / Math.max(1, dirtSource.width);
  const tileScaleY = 128 / Math.max(1, dirtSource.height);

  const addRoadRect = (rect: Phaser.Geom.Rectangle): void => {
    const road = scene.add.tileSprite(
      rect.centerX,
      rect.centerY,
      rect.width,
      rect.height,
      'aldea-dirt'
    )
      .setDepth(2.25)
      .setTileScale(tileScaleX, tileScaleY);

    scene.walkableAreas.push(new Phaser.Geom.Rectangle(rect.x, rect.y, rect.width, rect.height));
    scene.ui.ignoreWorldObject(road);
  };

  addRoadRect(C26_SOUTH_VERTICAL);
  addRoadRect(C26_SOUTH_HORIZONTAL);
}

function installAldeaNpcAndAccessFix(): void {
  const prototype = AldeaScene.prototype as unknown as AldeaPrototype;
  if (prototype.__villageVisualAndAccessRefinementInstalled) return;
  prototype.__villageVisualAndAccessRefinementInstalled = true;

  const originalInit = prototype.init;
  const originalCreate = prototype.create;
  const originalUpdate = prototype.update;

  prototype.init = function initVisualAccess(this: AldeaRuntime, data: unknown): void {
    originalInit.call(this, data);
    this.__c26CabinTransitioning = false;
  };

  prototype.create = function createVisualAccess(this: AldeaRuntime): void {
    originalCreate.call(this);

    // La cámara del HUD renderiza también objetos del mundo si no se excluyen.
    // Eso producía el "clon" pequeño de cada NPC en la esquina superior izquierda.
    (this.__villageNpcs ?? []).forEach((npc) => {
      this.ui.ignoreWorldObject(npc.sprite);
    });

    addC26SouthRoad(this);
  };

  prototype.update = function updateVisualAccess(this: AldeaRuntime, time: number, delta: number): void {
    originalUpdate.call(this, time, delta);

    if (this.__c26CabinTransitioning || !this.scene.isActive()) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body || body.velocity.y >= -5) return;

    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, C26_DOOR.x, C26_DOOR.y);
    if (distance > C26_TRIGGER_RADIUS) return;

    this.__c26CabinTransitioning = true;
    body.setVelocity(0);
    this.player.anims.stop();
    this.cameras.main.fadeOut(260, 18, 12, 8);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('VillageCabinScene', {
        characterId: this.characterId,
        kind: 'blessing',
        returnX: C26_DOOR.x,
        returnY: C26_DOOR.y + 42
      });
    });
  };
}

function installCabinVisualFixes(): void {
  const prototype = VillageCabinScene.prototype as unknown as CabinPrototype;
  if (prototype.__woodFloorRefinementInstalled) return;
  prototype.__woodFloorRefinementInstalled = true;

  const originalCreate = prototype.create;
  const originalCheckCoinCollection = prototype.checkCoinCollection;

  prototype.create = function createWithCleanWoodFloor(this: CabinRuntime): void {
    originalCreate.call(this);

    // VillageCabinScene ya usa floor-wood-01.png como TileSprite repetible.
    // El cuadrado grande de la esquina era la misma textura siendo dibujada también
    // por la cámara del HUD. La dejamos únicamente en la cámara principal.
    const uiCamera = this.cameras.getCamera('VillageCabinSceneUICamera');
    if (!uiCamera) return;

    const floorObjects = this.children.list.filter((object) => {
      if (!(object instanceof Phaser.GameObjects.TileSprite)) return false;
      return object.texture.key === 'village-cabin-floor';
    });
    if (floorObjects.length > 0) uiCamera.ignore(floorObjects);
  };

  prototype.checkCoinCollection = function checkCoinCollectionWithoutFlash(this: CabinRuntime): void {
    // Conservamos la recogida, contador y desaparición de la moneda, pero anulamos
    // únicamente el flash de cámara que producía el pantallazo en cada recogida.
    const camera = this.cameras.main;
    const originalFlash = camera.flash;
    camera.flash = (() => camera) as typeof camera.flash;
    try {
      originalCheckCoinCollection.call(this);
    } finally {
      camera.flash = originalFlash;
    }
  };
}

export function installVillageVisualAndAccessRefinement(): void {
  installAldeaNpcAndAccessFix();
  installCabinVisualFixes();
}

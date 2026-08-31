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
};

const C26_DOOR = new Phaser.Math.Vector2(816, 456);
const C26_TRIGGER_RADIUS = 74;
const ROOM_WIDTH = 960;
const ROOM_HEIGHT = 540;

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

function installCabinWoodFloorFix(): void {
  const prototype = VillageCabinScene.prototype as unknown as CabinPrototype;
  if (prototype.__woodFloorRefinementInstalled) return;
  prototype.__woodFloorRefinementInstalled = true;

  const originalCreate = prototype.create;

  prototype.create = function createWithRealWoodFloor(this: CabinRuntime): void {
    originalCreate.call(this);

    const source = this.textures.get('village-cabin-floor').getSourceImage() as { width: number; height: number };
    const sourceWidth = Math.max(1, source.width);
    const sourceHeight = Math.max(1, source.height);

    // Repetimos el PNG real tantas veces como haga falta. Así no se estira una sola
    // imagen para cubrir toda la habitación y se mantiene la sensación de tablones.
    const tileWidth = 128;
    const tileHeight = Math.max(48, Math.round(tileWidth * (sourceHeight / sourceWidth)));

    for (let y = 0; y < ROOM_HEIGHT; y += tileHeight) {
      for (let x = 0; x < ROOM_WIDTH; x += tileWidth) {
        this.add.image(x, y, 'village-cabin-floor')
          .setOrigin(0, 0)
          .setDisplaySize(tileWidth, tileHeight)
          .setDepth(0.35);
      }
    }
  };
}

export function installVillageVisualAndAccessRefinement(): void {
  installAldeaNpcAndAccessFix();
  installCabinWoodFloorFix();
}

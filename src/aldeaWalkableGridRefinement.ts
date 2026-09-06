import * as Phaser from 'phaser';
import { AldeaScene } from './scenes/AldeaScene';
import { isAldeaEntranceCell, isAldeaWalkableFootPoint } from './aldeaWalkableGrid';
import type { CharacterId } from './gameData';

type AldeaRuntime = Phaser.Scene & {
  player: Phaser.Physics.Arcade.Sprite;
  characterId: CharacterId;
  exitStarted: boolean;
  worldColliders: Phaser.GameObjects.Rectangle[];
  __villageDialogueOpen?: boolean;
  __villageCabinTransitioning?: boolean;
  __c26CabinTransitioning?: boolean;
  __churchTransitioning?: boolean;
  __aldeaGridTransitioning?: boolean;
};

type AldeaPrototype = {
  __aldeaWalkableGridInstalled?: boolean;
  create: (this: AldeaRuntime) => void;
  isWalkablePoint: (x: number, y: number) => boolean;
  update: (this: AldeaRuntime, time: number, delta: number) => void;
};

function startVillageInterior(
  scene: AldeaRuntime,
  kind: 'coins' | 'wine' | 'blessing',
  returnX: number,
  returnY: number
): void {
  if (scene.__aldeaGridTransitioning) return;
  scene.__aldeaGridTransitioning = true;
  const body = scene.player.body as Phaser.Physics.Arcade.Body;
  body.setVelocity(0);
  scene.player.anims.stop();
  scene.cameras.main.fadeOut(260, 18, 12, 8);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.scene.start('VillageCabinScene', {
      characterId: scene.characterId,
      kind,
      returnX,
      returnY
    });
  });
}

function startChurchInterior(scene: AldeaRuntime): void {
  if (scene.__aldeaGridTransitioning) return;
  scene.__aldeaGridTransitioning = true;
  const body = scene.player.body as Phaser.Physics.Arcade.Body;
  body.setVelocity(0);
  scene.player.anims.stop();
  scene.cameras.main.fadeOut(260, 18, 12, 8);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.scene.start('ChurchInteriorScene', {
      characterId: scene.characterId,
      returnX: 560,
      returnY: 240
    });
  });
}

/**
 * Exterior de La Aldea:
 * - área jugable positiva por celdas de 32 px;
 * - autoridad = centro entre los pies;
 * - entradas de edificios definidas por celdas exactas.
 */
export function installAldeaWalkableGridRefinement(): void {
  const prototype = AldeaScene.prototype as unknown as AldeaPrototype;
  if (prototype.__aldeaWalkableGridInstalled) return;
  prototype.__aldeaWalkableGridInstalled = true;

  const originalCreate = prototype.create;
  prototype.create = function createWithGridOwnedCollision(this: AldeaRuntime): void {
    originalCreate.call(this);

    // El grid positivo es ahora la única autoridad para el movimiento del jugador.
    // Los colliders físicos antiguos de edificios/árboles pueden contradecir una celda
    // declarada jugable, especialmente en puertas. Los retiramos después de que todos
    // los refinamientos anteriores hayan terminado de construir la escena.
    this.worldColliders.forEach((blocker) => {
      if (blocker.active) blocker.destroy();
    });
    this.worldColliders = [];
  };

  prototype.isWalkablePoint = function isWalkablePointFromGrid(x: number, y: number): boolean {
    // AldeaScene entrega aquí directamente el punto de pies (x, y).
    return isAldeaWalkableFootPoint(x, y - 20);
  };

  const originalUpdate = prototype.update;
  prototype.update = function updateWithExactGridEntrances(this: AldeaRuntime, time: number, delta: number): void {
    // Los refinamientos antiguos de entradas usaban distancias/radios. Los anulamos
    // durante este update y aplicamos después únicamente las celdas exactas del grid.
    const villageWasTransitioning = this.__villageCabinTransitioning ?? false;
    const c26WasTransitioning = this.__c26CabinTransitioning ?? false;
    const churchWasTransitioning = this.__churchTransitioning ?? false;

    this.__villageCabinTransitioning = true;
    this.__c26CabinTransitioning = true;
    this.__churchTransitioning = true;

    originalUpdate.call(this, time, delta);

    this.__villageCabinTransitioning = villageWasTransitioning;
    this.__c26CabinTransitioning = c26WasTransitioning;
    this.__churchTransitioning = churchWasTransitioning;

    if (this.exitStarted || this.__aldeaGridTransitioning || this.__villageDialogueOpen || !this.scene.isActive()) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body || body.velocity.y >= -5) return;

    if (isAldeaEntranceCell('church', this.player.x, this.player.y)) {
      startChurchInterior(this);
      return;
    }

    if (isAldeaEntranceCell('blessing', this.player.x, this.player.y)) {
      startVillageInterior(this, 'blessing', 816, 498);
      return;
    }

    if (isAldeaEntranceCell('wine', this.player.x, this.player.y)) {
      startVillageInterior(this, 'wine', 688, 680);
      return;
    }

    if (isAldeaEntranceCell('coins', this.player.x, this.player.y)) {
      startVillageInterior(this, 'coins', 144, 648);
    }
  };
}

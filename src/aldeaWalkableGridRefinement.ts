import * as Phaser from 'phaser';
import { AldeaScene } from './scenes/AldeaScene';
import { isAldeaEntranceCell, isAldeaWalkableFootPoint, type AldeaEntranceKey } from './aldeaWalkableGrid';
import type { CharacterId } from './gameData';

type AldeaRuntime = Phaser.Scene & {
  player: Phaser.Physics.Arcade.Sprite;
  characterId: CharacterId;
  exitStarted: boolean;
  worldColliders: Phaser.GameObjects.Rectangle[];
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  ui?: {
    touchDirections: Record<'left' | 'right' | 'up' | 'down', boolean>;
  };
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

type VillageEntranceKind = 'coins' | 'wine' | 'blessing';

type EntranceSpec =
  | { key: 'church'; scene: 'church' }
  | { key: Exclude<AldeaEntranceKey, 'church'>; scene: 'village'; kind: VillageEntranceKind; returnX: number; returnY: number };

const ENTRANCE_SPECS: EntranceSpec[] = [
  { key: 'church', scene: 'church' },
  { key: 'blessing', scene: 'village', kind: 'blessing', returnX: 816, returnY: 498 },
  { key: 'wine', scene: 'village', kind: 'wine', returnX: 688, returnY: 680 },
  { key: 'coins', scene: 'village', kind: 'coins', returnX: 144, returnY: 648 }
];

function startVillageInterior(
  scene: AldeaRuntime,
  kind: VillageEntranceKind,
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

function playerIntendsToMoveUp(scene: AldeaRuntime): boolean {
  const keyboardUp = scene.cursors?.up.isDown ?? false;
  const touchUp = scene.ui?.touchDirections.up ?? false;
  const body = scene.player.body as Phaser.Physics.Arcade.Body | null;
  const velocityUp = Boolean(body && body.velocity.y < -5);
  return keyboardUp || touchUp || velocityUp;
}

function triggerExactEntrance(scene: AldeaRuntime): void {
  if (!playerIntendsToMoveUp(scene)) return;

  for (const entrance of ENTRANCE_SPECS) {
    if (!isAldeaEntranceCell(entrance.key, scene.player.x, scene.player.y)) continue;

    if (entrance.scene === 'church') {
      startChurchInterior(scene);
    } else {
      startVillageInterior(scene, entrance.kind, entrance.returnX, entrance.returnY);
    }
    return;
  }
}

/**
 * Exterior de La Aldea:
 * - área jugable positiva por celdas de 32 px;
 * - autoridad = centro entre los pies;
 * - entradas de edificios definidas por celdas exactas;
 * - toda celda de entrada es jugable por construcción;
 * - la transición se dispara al estar en la celda y avanzar hacia arriba.
 */
export function installAldeaWalkableGridRefinement(): void {
  const prototype = AldeaScene.prototype as unknown as AldeaPrototype;
  if (prototype.__aldeaWalkableGridInstalled) return;
  prototype.__aldeaWalkableGridInstalled = true;

  const originalCreate = prototype.create;
  prototype.create = function createWithGridOwnedCollision(this: AldeaRuntime): void {
    // La misma instancia de AldeaScene se reutiliza al volver de un interior.
    // Hay que limpiar este cerrojo en cada create; de lo contrario, tras entrar una vez
    // en una construcción, las siguientes entradas quedan bloqueadas para siempre.
    this.__aldeaGridTransitioning = false;

    originalCreate.call(this);

    // Solo retiramos los blockers que Aldea registra de forma explícita.
    // No recorremos la colección interna de cuerpos físicos de Phaser: hacerlo
    // provocaba una excepción en runtime y detenía por completo el update de la escena.
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
    const villageWasTransitioning = this.__villageCabinTransitioning ?? false;
    const c26WasTransitioning = this.__c26CabinTransitioning ?? false;
    const churchWasTransitioning = this.__churchTransitioning ?? false;

    this.__villageCabinTransitioning = true;
    this.__c26CabinTransitioning = true;
    this.__churchTransitioning = true;

    try {
      originalUpdate.call(this, time, delta);
    } finally {
      this.__villageCabinTransitioning = villageWasTransitioning;
      this.__c26CabinTransitioning = c26WasTransitioning;
      this.__churchTransitioning = churchWasTransitioning;
    }

    if (this.exitStarted || this.__aldeaGridTransitioning || this.__villageDialogueOpen || !this.scene.isActive()) return;

    triggerExactEntrance(this);
  };
}

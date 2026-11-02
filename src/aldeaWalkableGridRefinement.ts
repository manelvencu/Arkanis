import * as Phaser from 'phaser';
import { AldeaScene } from './scenes/AldeaScene';
import {
  ALDEA_GRID_SIZE, ALDEA_GRID_COLUMNS, ALDEA_GRID_ROWS, ALDEA_WALKABLE_CELLS,
  isAldeaEntranceCell, isAldeaWalkableFootPoint, type AldeaEntranceKey
} from './aldeaWalkableGrid';
import type { CharacterId } from './gameData';

type AldeaRuntime = Phaser.Scene & {
  player: Phaser.Physics.Arcade.Sprite;
  characterId: CharacterId;
  exitStarted: boolean;
  worldColliders: Phaser.GameObjects.Rectangle[];
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  ui?: {
    touchDirections: Record<'left' | 'right' | 'up' | 'down', boolean>;
    ignoreWorldObject: (object: Phaser.GameObjects.GameObject) => void;
  };
  __villageDialogueOpen?: boolean;
  __villageCabinTransitioning?: boolean;
  __c26CabinTransitioning?: boolean;
  __churchTransitioning?: boolean;
  __aldeaGridTransitioning?: boolean;
  __aldeaHelpGrid?: Phaser.GameObjects.Image;
  __aldeaHelpGridKey?: Phaser.Input.Keyboard.Key;
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

const GRID_PREVIEW_TEXTURE = 'aldea-help-walkability-grid';

function createWalkabilityHelpGrid(scene: AldeaRuntime): void {
  const width = ALDEA_GRID_COLUMNS * ALDEA_GRID_SIZE;
  const height = ALDEA_GRID_ROWS * ALDEA_GRID_SIZE;

  // Una sola textura de 960x704: no creamos centenares de textos/rectángulos individuales.
  // El conjunto usado para pintar es el MISMO que decide si los pies pueden pisar una celda.
  if (scene.textures.exists(GRID_PREVIEW_TEXTURE)) scene.textures.remove(GRID_PREVIEW_TEXTURE);
  const texture = scene.textures.createCanvas(GRID_PREVIEW_TEXTURE, width, height);
  if (!texture) return;

  const ctx = texture.context;
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 9px Arial';

  for (let f = 1; f <= ALDEA_GRID_ROWS; f += 1) {
    for (let c = 1; c <= ALDEA_GRID_COLUMNS; c += 1) {
      const x = (c - 1) * ALDEA_GRID_SIZE;
      const y = (f - 1) * ALDEA_GRID_SIZE;
      const walkable = ALDEA_WALKABLE_CELLS.has(`${c}:${f}`);

      ctx.fillStyle = walkable ? 'rgba(16, 185, 76, 0.30)' : 'rgba(228, 35, 35, 0.30)';
      ctx.fillRect(x, y, ALDEA_GRID_SIZE, ALDEA_GRID_SIZE);
      ctx.strokeStyle = 'rgba(17, 21, 16, 0.75)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, ALDEA_GRID_SIZE - 1, ALDEA_GRID_SIZE - 1);

      // Dos líneas legibles con zoom x2. Ejemplo: C12 / F15.
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillStyle = '#ffffff';
      ctx.strokeText(`C${c}`, x + 16, y + 11);
      ctx.fillText(`C${c}`, x + 16, y + 11);
      ctx.strokeText(`F${f}`, x + 16, y + 22);
      ctx.fillText(`F${f}`, x + 16, y + 22);
    }
  }

  texture.refresh();
  const overlay = scene.add.image(width / 2, height / 2, GRID_PREVIEW_TEXTURE)
    .setDepth(100)
    .setVisible(true);
  scene.__aldeaHelpGrid = overlay;
  // El HUD utiliza una cámara adicional: la cuadrícula debe verse solo en el mundo.
  scene.ui?.ignoreWorldObject?.(overlay);
  scene.__aldeaHelpGridKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.G);
}

const ENTRANCE_SPECS: EntranceSpec[] = [
  { key: 'church', scene: 'church' },
  { key: 'blessing', scene: 'village', kind: 'blessing', returnX: 816, returnY: 498 },
  { key: 'wine', scene: 'village', kind: 'wine', returnX: 688, returnY: 680 },
  { key: 'coins', scene: 'village', kind: 'coins', returnX: 208, returnY: 610 }
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

    createWalkabilityHelpGrid(this);
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

    // G alterna la vista de depuración sin modificar las colisiones.
    if (this.__aldeaHelpGridKey && Phaser.Input.Keyboard.JustDown(this.__aldeaHelpGridKey)) {
      this.__aldeaHelpGrid?.setVisible(!this.__aldeaHelpGrid.visible);
    }

    if (this.exitStarted || this.__aldeaGridTransitioning || this.__villageDialogueOpen || !this.scene.isActive()) return;

    triggerExactEntrance(this);
  };
}

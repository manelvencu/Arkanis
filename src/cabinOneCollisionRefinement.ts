import * as Phaser from 'phaser';
import { CabinInteriorScene } from './scenes/CabinInteriorScene';
import { CabinOneScene } from './scenes/CabinOneScene';

const ROOM_WIDTH = 960;
const ROOM_HEIGHT = 540;
const GRID_COLUMNS = 30;
const GRID_ROWS = 15;
const CELL_WIDTH = ROOM_WIDTH / GRID_COLUMNS;
const CELL_HEIGHT = ROOM_HEIGHT / GRID_ROWS;

// C1-C4 y C27-C30 son pared lateral. Como el cuerpo físico del jugador mide
// 30px de ancho, su centro debe permanecer dentro de C5-C26 dejando medio cuerpo.
const PLAYER_FOOT_BODY_HALF_WIDTH = 15;
const HARD_LEFT_X = 4 * CELL_WIDTH + PLAYER_FOOT_BODY_HALF_WIDTH;
const HARD_RIGHT_X = 26 * CELL_WIDTH - PLAYER_FOOT_BODY_HALF_WIDTH;

type CabinOneRuntime = Phaser.Scene & {
  player: Phaser.Physics.Arcade.Sprite;
  interiorBlockers?: Phaser.Physics.Arcade.StaticGroup;
};

type CabinOnePrototype = {
  __collisionGridRefinementInstalled?: boolean;
  create?: (this: CabinOneRuntime) => void;
  update?: (this: CabinOneRuntime) => void;
};

export function installCabinOneCollisionRefinement(): void {
  const prototype = CabinOneScene.prototype as unknown as CabinOnePrototype;
  if (prototype.__collisionGridRefinementInstalled) return;
  prototype.__collisionGridRefinementInstalled = true;

  const originalCreate = CabinInteriorScene.prototype.create as unknown as (this: CabinOneRuntime) => void;
  const originalUpdate = CabinInteriorScene.prototype.update as unknown as (this: CabinOneRuntime) => void;

  prototype.create = function createCabinOneWithRefinedGrid(this: CabinOneRuntime): void {
    originalCreate.call(this);

    // Reutilizamos el mismo grupo que ya tiene conectado el collider del interior.
    // La rejilla visual es solo una guía: estas colisiones existen aunque se oculte.
    const blockers = this.interiorBlockers ?? this.physics.add.staticGroup();
    blockers.clear(true, true);
    this.interiorBlockers = blockers;

    const blockRange = (c1: number, f1: number, c2: number, f2: number): void => {
      const left = (c1 - 1) * CELL_WIDTH;
      const top = (f1 - 1) * CELL_HEIGHT;
      const width = (c2 - c1 + 1) * CELL_WIDTH;
      const height = (f2 - f1 + 1) * CELL_HEIGHT;
      const blocker = this.add.rectangle(left + width / 2, top + height / 2, width, height, 0x000000, 0);
      this.physics.add.existing(blocker, true);
      blockers.add(blocker);
    };

    // Parte superior: F1-F4 completas.
    blockRange(1, 1, 30, 4);

    // F5 se libera de C9 a C26 inclusive.
    blockRange(1, 5, 8, 5);
    blockRange(27, 5, 30, 5);

    // Laterales permanentes.
    blockRange(1, 6, 4, 12);
    blockRange(27, 6, 30, 12);

    // Cama.
    blockRange(5, 6, 8, 8);

    // Mesa y sillas de la derecha.
    blockRange(24, 7, 27, 10);

    // F11-F12 bloqueadas salvo el pasillo central C14-C17.
    blockRange(1, 11, 13, 12);
    blockRange(18, 11, 30, 12);

    // F13-F15 bloqueadas salvo el mismo pasillo C14-C17 hasta la salida.
    blockRange(1, 13, 13, 15);
    blockRange(18, 13, 30, 15);
  };

  prototype.update = function updateCabinOneWithHardSideBounds(this: CabinOneRuntime): void {
    originalUpdate.call(this);

    // Refuerzo determinista de los laterales. Evita que al mantener pulsada una
    // dirección Arcade Physics permita acabar atravesando varios blockers contiguos.
    // No depende de la guía visual del grid.
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.player.x < HARD_LEFT_X) {
      this.player.setX(HARD_LEFT_X);
      if (body.velocity.x < 0) body.setVelocityX(0);
    } else if (this.player.x > HARD_RIGHT_X) {
      this.player.setX(HARD_RIGHT_X);
      if (body.velocity.x > 0) body.setVelocityX(0);
    }
  };
}

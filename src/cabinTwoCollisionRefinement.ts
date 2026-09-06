import * as Phaser from 'phaser';
import { CabinInteriorScene } from './scenes/CabinInteriorScene';
import { CabinTwoScene } from './scenes/CabinTwoScene';

const ROOM_WIDTH = 960;
const ROOM_HEIGHT = 540;
const GRID_COLUMNS = 30;
const GRID_ROWS = 15;
const CELL_WIDTH = ROOM_WIDTH / GRID_COLUMNS;
const CELL_HEIGHT = ROOM_HEIGHT / GRID_ROWS;

type CabinTwoRuntime = Phaser.Scene & {
  player: Phaser.Physics.Arcade.Sprite;
  chest: Phaser.Physics.Arcade.Image;
  interiorBlockers?: Phaser.Physics.Arcade.StaticGroup;
};

type CabinTwoPrototype = {
  __collisionGridRefinementInstalled?: boolean;
  create?: (this: CabinTwoRuntime) => void;
};

export function installCabinTwoCollisionRefinement(): void {
  const prototype = CabinTwoScene.prototype as unknown as CabinTwoPrototype;
  if (prototype.__collisionGridRefinementInstalled) return;
  prototype.__collisionGridRefinementInstalled = true;

  const originalCreate = CabinInteriorScene.prototype.create as unknown as (this: CabinTwoRuntime) => void;

  prototype.create = function createCabinTwoWithGridCollisions(this: CabinTwoRuntime): void {
    originalCreate.call(this);

    const blockers = this.physics.add.staticGroup();
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

    // F1-F3 completas.
    blockRange(1, 1, 30, 3);

    // Laterales completos. Se crean como rectángulos continuos para que la colisión
    // funcione igual al llegar de frente o rozando lateralmente.
    blockRange(1, 4, 6, 15);
    blockRange(27, 4, 30, 15);

    // C26 completa de arriba a abajo.
    blockRange(26, 1, 26, 15);

    // Mueble/volumen superior derecho: F1C23 a F7C26.
    // F1-F3 ya están cubiertas por la pared superior; mantenemos F4-F7 para C23-C25
    // porque C26 ya está bloqueada de arriba a abajo.
    blockRange(23, 4, 25, 7);

    // Refinamiento adicional: F4C22 a F5C24.
    blockRange(22, 4, 24, 5);

    // F11-F15 bloqueadas salvo el pasillo central C14-C17.
    blockRange(7, 11, 13, 15);
    blockRange(18, 11, 25, 15);

    // Collider propio de esta cabaña para no depender de ningún refinamiento anterior.
    this.physics.add.collider(this.player, blockers);

    // Baúl entre F5C11 y F5C12: exactamente sobre la divisoria entre ambas celdas.
    const chestX = 11 * CELL_WIDTH;
    const chestY = (5 - 0.5) * CELL_HEIGHT;
    this.chest.setPosition(chestX, chestY);
    this.chest.refreshBody();
  };
}

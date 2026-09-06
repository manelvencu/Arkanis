import * as Phaser from 'phaser';
import { CabinInteriorScene } from './scenes/CabinInteriorScene';
import { CabinThreeScene } from './scenes/CabinThreeScene';

const ROOM_WIDTH = 960;
const ROOM_HEIGHT = 540;
const GRID_COLUMNS = 30;
const GRID_ROWS = 15;
const CELL_WIDTH = ROOM_WIDTH / GRID_COLUMNS;
const CELL_HEIGHT = ROOM_HEIGHT / GRID_ROWS;

// Mismos límites laterales duros que en Cabaña 1.
const PLAYER_FOOT_BODY_HALF_WIDTH = 15;
const HARD_LEFT_X = 4 * CELL_WIDTH + PLAYER_FOOT_BODY_HALF_WIDTH;
const HARD_RIGHT_X = 26 * CELL_WIDTH - PLAYER_FOOT_BODY_HALF_WIDTH;

type CabinThreeRuntime = Phaser.Scene & {
  player: Phaser.Physics.Arcade.Sprite;
  interiorBlockers?: Phaser.Physics.Arcade.StaticGroup;
};

type CabinThreePrototype = {
  __collisionGridRefinementInstalled?: boolean;
  create?: (this: CabinThreeRuntime) => void;
  update?: (this: CabinThreeRuntime) => void;
};

export function installCabinThreeCollisionRefinement(): void {
  const prototype = CabinThreeScene.prototype as unknown as CabinThreePrototype;
  if (prototype.__collisionGridRefinementInstalled) return;
  prototype.__collisionGridRefinementInstalled = true;

  const originalCreate = CabinInteriorScene.prototype.create as unknown as (this: CabinThreeRuntime) => void;
  const originalUpdate = CabinInteriorScene.prototype.update as unknown as (this: CabinThreeRuntime) => void;

  prototype.create = function createCabinThreeWithSameGridAsCabinOne(this: CabinThreeRuntime): void {
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

    // Exactamente los mismos límites que Cabaña 1.
    blockRange(1, 1, 30, 4);
    blockRange(1, 5, 8, 5);
    blockRange(27, 5, 30, 5);
    blockRange(1, 6, 4, 12);
    blockRange(27, 6, 30, 12);
    blockRange(5, 6, 8, 8);
    blockRange(24, 7, 27, 10);
    blockRange(1, 11, 13, 12);
    blockRange(18, 11, 30, 12);
    blockRange(1, 13, 13, 15);
    blockRange(18, 13, 30, 15);

    this.physics.add.collider(this.player, blockers);
  };

  prototype.update = function updateCabinThreeWithHardSideBounds(this: CabinThreeRuntime): void {
    originalUpdate.call(this);

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

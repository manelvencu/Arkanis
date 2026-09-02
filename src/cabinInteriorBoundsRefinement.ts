import * as Phaser from 'phaser';
import { CabinInteriorScene } from './scenes/CabinInteriorScene';
import { VillageCabinScene } from './scenes/VillageCabinScene';

type CabinPrototype = {
  __cabinInteriorBoundsRefinementInstalled?: boolean;
  create: (this: Phaser.Scene) => void;
  update: (this: Phaser.Scene) => void;
};

type CabinRuntime = Phaser.Scene & {
  player: Phaser.Physics.Arcade.Sprite;
};

const ROOM_WIDTH = 960;
const ROOM_HEIGHT = 540;
const PLAYER_MIN_X = 119;
const PLAYER_MAX_X = 841;

function clampHorizontal(scene: CabinRuntime): void {
  if (!scene.player?.active) return;

  const body = scene.player.body as Phaser.Physics.Arcade.Body;
  const clampedX = Phaser.Math.Clamp(scene.player.x, PLAYER_MIN_X, PLAYER_MAX_X);
  if (clampedX === scene.player.x) return;

  scene.player.x = clampedX;
  body.updateFromGameObject();
  if ((clampedX === PLAYER_MIN_X && body.velocity.x < 0) || (clampedX === PLAYER_MAX_X && body.velocity.x > 0)) {
    body.setVelocityX(0);
  }
}

export function installCabinInteriorBoundsRefinement(): void {
  const trainingPrototype = CabinInteriorScene.prototype as unknown as CabinPrototype;
  if (!trainingPrototype.__cabinInteriorBoundsRefinementInstalled) {
    trainingPrototype.__cabinInteriorBoundsRefinementInstalled = true;
    const originalTrainingCreate = trainingPrototype.create;
    const originalTrainingUpdate = trainingPrototype.update;

    trainingPrototype.create = function createTrainingCabinViewport(this: CabinRuntime): void {
      originalTrainingCreate.call(this);
      // La base mide exactamente 960x540. Zoom 1 muestra el interior completo dentro
      // del área jugable, sin permitir que el personaje desaparezca fuera de pantalla.
      this.cameras.main.setZoom(1);
      this.cameras.main.centerOn(ROOM_WIDTH / 2, ROOM_HEIGHT / 2);
    };

    trainingPrototype.update = function updateTrainingCabinBounds(this: CabinRuntime): void {
      clampHorizontal(this);
      originalTrainingUpdate.call(this);
      clampHorizontal(this);
    };
  }

  const villagePrototype = VillageCabinScene.prototype as unknown as CabinPrototype;
  if (!villagePrototype.__cabinInteriorBoundsRefinementInstalled) {
    villagePrototype.__cabinInteriorBoundsRefinementInstalled = true;
    const originalVillageUpdate = villagePrototype.update;

    villagePrototype.update = function updateVillageCabinBounds(this: CabinRuntime): void {
      // La colisión visual lateral coincide con el inicio del borde oscuro. El clamp
      // evita que mantener pulsada una dirección termine atravesando esa colisión.
      clampHorizontal(this);
      originalVillageUpdate.call(this);
      clampHorizontal(this);
    };
  }
}

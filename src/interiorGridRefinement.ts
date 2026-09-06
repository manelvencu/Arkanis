import * as Phaser from 'phaser';
import { CabinInteriorScene } from './scenes/CabinInteriorScene';
import { VillageCabinScene } from './scenes/VillageCabinScene';
import { ChurchInteriorScene } from './scenes/ChurchInteriorScene';
import { createInteriorGridGuide } from './interiorGridGuide';

type SceneWithCreate = Phaser.Scene & {
  create: () => void;
};

type CreatePrototype = {
  create: (this: SceneWithCreate) => void;
  __interiorGridGuideInstalled?: boolean;
};

function installOnPrototype(prototype: CreatePrototype): void {
  if (prototype.__interiorGridGuideInstalled) return;
  prototype.__interiorGridGuideInstalled = true;

  const originalCreate = prototype.create;
  prototype.create = function createWithInteriorGrid(this: SceneWithCreate): void {
    originalCreate.call(this);

    const guide = createInteriorGridGuide(this, 960, 540);

    // VillageCabinScene y ChurchInteriorScene tienen una segunda cámara exclusiva para HUD.
    // La rejilla pertenece al mundo y no debe aparecer duplicada en esa cámara.
    const uiCamera = this.cameras.getCamera(`${this.scene.key}UICamera`);
    uiCamera?.ignore(guide.container);
  };
}

/**
 * Activa la rejilla temporal de definición de colisiones en todos los interiores:
 * - las tres cabañas de Zona Entrenamiento,
 * - cabañas y tienda de vino de La Aldea,
 * - iglesia.
 */
export function installInteriorGridRefinement(): void {
  installOnPrototype(CabinInteriorScene.prototype as unknown as CreatePrototype);
  installOnPrototype(VillageCabinScene.prototype as unknown as CreatePrototype);
  installOnPrototype(ChurchInteriorScene.prototype as unknown as CreatePrototype);
}

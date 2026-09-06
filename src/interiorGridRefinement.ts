import * as Phaser from 'phaser';
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
 * Activa la rejilla temporal solo en los interiores que todavía estamos definiendo:
 * - cabañas y tienda de vino de La Aldea,
 * - iglesia.
 *
 * Las tres cabañas de Zona Entrenamiento ya tienen su área jugable validada y
 * dejan de mostrar la guía. Sus colisiones siguen activas porque dependen del mapa
 * lógico de celdas, no de la rejilla visual.
 */
export function installInteriorGridRefinement(): void {
  installOnPrototype(VillageCabinScene.prototype as unknown as CreatePrototype);
  installOnPrototype(ChurchInteriorScene.prototype as unknown as CreatePrototype);
}

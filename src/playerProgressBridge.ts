import * as Phaser from 'phaser';
import { AldeaScene } from './scenes/AldeaScene';
import { getVillageProgress } from './villageProgress';

type AldeaRuntime = Phaser.Scene & {
  ui: {
    updateEnergy: (energy: number) => void;
    updateCoins: (coins: number) => void;
  };
};

type AldeaPrototype = {
  __playerProgressBridgeInstalled?: boolean;
  create: (this: AldeaRuntime) => void;
};

const REGISTRY_ENERGY_KEY = 'arkanis.player.energy';
const REGISTRY_COINS_KEY = 'arkanis.player.coins';

export function installPlayerProgressBridge(): void {
  const prototype = AldeaScene.prototype as unknown as AldeaPrototype;
  if (prototype.__playerProgressBridgeInstalled) return;
  prototype.__playerProgressBridgeInstalled = true;

  const originalCreate = prototype.create;

  prototype.create = function createWithGlobalPlayerProgress(this: AldeaRuntime): void {
    originalCreate.call(this);

    // villageProgress es el estado de la partida. El Registry puede contener
    // datos desactualizados (p. ej. tras recoger monedas en las cabañas).
    // Nunca debe sobrescribir el progreso al volver a La Aldea.
    const progress = getVillageProgress();
    this.registry.set(REGISTRY_ENERGY_KEY, progress.energy);
    this.registry.set(REGISTRY_COINS_KEY, progress.coins);
    this.ui.updateEnergy(progress.energy);
    this.ui.updateCoins(progress.coins);
  };
}

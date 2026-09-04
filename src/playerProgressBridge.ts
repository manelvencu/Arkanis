import { AldeaScene } from './scenes/AldeaScene';
import { getVillageProgress, setVillageProgressFromTraining } from './villageProgress';

type AldeaRuntime = AldeaScene & {
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

    const storedEnergy = this.registry.get(REGISTRY_ENERGY_KEY);
    const storedCoins = this.registry.get(REGISTRY_COINS_KEY);

    if (typeof storedEnergy === 'number' && typeof storedCoins === 'number') {
      setVillageProgressFromTraining(storedEnergy, storedCoins);
    }

    const progress = getVillageProgress();
    this.ui.updateEnergy(progress.energy);
    this.ui.updateCoins(progress.coins);
  };
}

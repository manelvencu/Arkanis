export type VillageCabinKind = 'coins' | 'wine' | 'blessing';

export interface VillageProgress {
  npcMessageIndex: number;
  fragmentHolderReceived: boolean;
  coins: number;
  energy: number;
  collectedCabinCoins: number[];
  templeRewardReceived: boolean;
  desertCarpetPurchased: boolean;
  desertCarpetUsedInMaze: boolean;
  desertFragmentObtained: boolean;
}

const progress: VillageProgress = {
  npcMessageIndex: 0,
  fragmentHolderReceived: false,
  coins: 0,
  energy: 100,
  collectedCabinCoins: [],
  templeRewardReceived: false,
  desertCarpetPurchased: false,
  desertCarpetUsedInMaze: false,
  desertFragmentObtained: false
};

export function getVillageProgress(): VillageProgress {
  return progress;
}

export function setVillageProgressFromTraining(energy: number, coins: number): void {
  progress.energy = Math.max(0, Math.min(100, energy));
  progress.coins = Math.max(0, Math.floor(coins));
}

export function takeNextNpcMessage(): { message: string; deliveredHolder: boolean } | null {
  const messages = [
    'Hay ocho mundos que deberás ir visitando. En cada uno deberás conseguir un fragmento de la Joya de Arkanis.',
    'Cuando reúnas los ocho fragmentos de la Joya de Arkanis, los tienes que llevar a la torre más alta del Castillo de Arkanis.',
    '¡Toma explorador! Aquí debes colocar todos los fragmentos de la Joya de Arkanis.'
  ] as const;

  if (progress.npcMessageIndex >= messages.length) return null;

  const index = progress.npcMessageIndex;
  progress.npcMessageIndex += 1;
  let deliveredHolder = false;

  if (index === 2 && !progress.fragmentHolderReceived) {
    progress.fragmentHolderReceived = true;
    deliveredHolder = true;
  }

  return { message: messages[index], deliveredHolder };
}

export function collectVillageCabinCoin(index: number): boolean {
  if (progress.collectedCabinCoins.includes(index)) return false;
  progress.collectedCabinCoins.push(index);
  progress.coins += 1;
  return true;
}

export function setVillageEnergy(value: number): void {
  progress.energy = Math.max(0, Math.min(100, value));
}

export function grantTempleReward(amount = 30): boolean {
  if (progress.templeRewardReceived) return false;
  progress.templeRewardReceived = true;
  progress.coins += Math.max(0, Math.floor(amount));
  return true;
}

export type DesertCarpetPurchaseResult = 'purchased' | 'owned' | 'insufficient';

export function purchaseDesertCarpet(price = 40): DesertCarpetPurchaseResult {
  const safePrice = Math.max(0, Math.floor(price));
  if (progress.desertCarpetPurchased) return 'owned';
  if (progress.coins < safePrice) return 'insufficient';

  progress.coins -= safePrice;
  progress.desertCarpetPurchased = true;
  progress.desertCarpetUsedInMaze = false;
  return 'purchased';
}

export function hasUsableDesertCarpet(): boolean {
  return progress.desertCarpetPurchased && !progress.desertCarpetUsedInMaze;
}

export function useDesertCarpetInMaze(): boolean {
  if (!hasUsableDesertCarpet()) return false;
  progress.desertCarpetUsedInMaze = true;
  return true;
}

// Ayuda temporal de pruebas: mientras construimos el laberinto, entrar en
// MazeScene entrega una alfombra disponible sin cobrar monedas.
export function grantDesertCarpetForMazeTest(): void {
  progress.desertCarpetPurchased = true;
  progress.desertCarpetUsedInMaze = false;
}


export function obtainDesertFragment(): boolean {
  if (progress.desertFragmentObtained) return false;
  progress.desertFragmentObtained = true;
  return true;
}

import { CabinInteriorScene } from './CabinInteriorScene';

export class CabinTwoScene extends CabinInteriorScene {
  constructor() {
    super({
      sceneKey: 'CabinTwoScene',
      assetPrefix: 'cabin2',
      chestId: 'training-cabin-2',
      chestMessage: 'Vas a iniciar un viaje por ocho mundos, cada cual más peligroso. En cada uno debes conseguir una pieza de la gran joya de Arkanis o no podrás continuar el viaje. Recuerda que tienes energía limitada, aléjate de los peligros.',
      returnX: 688
    });
  }
}

import { CabinInteriorScene } from './CabinInteriorScene';

export class CabinOneScene extends CabinInteriorScene {
  constructor() {
    super({
      sceneKey: 'CabinOneScene',
      assetPrefix: 'cabin1',
      chestId: 'training-cabin-1',
      chestMessage: 'En las tierras de Arkanis deberás ir pasando retos a los que debes enfrentarte sin miedo, para ello podrás disparar rayos, hechizos, podrás moverte, saltar y empujar objetos. Que tengas suerte!',
      returnX: 368
    });
  }
}

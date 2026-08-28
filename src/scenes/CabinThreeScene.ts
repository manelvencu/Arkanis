import { CabinInteriorScene } from './CabinInteriorScene';

export class CabinThreeScene extends CabinInteriorScene {
  constructor() {
    super({
      sceneKey: 'CabinThreeScene',
      assetPrefix: 'cabin3',
      chestId: 'training-cabin-3',
      chestMessage: 'Debes ser agradecido a los habitantes de los diferentes mundos y serás recompensado... O no.',
      returnX: 1008
    });
  }
}

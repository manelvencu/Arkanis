import * as Phaser from 'phaser';
import './style.css';
import { IntroScene } from './scenes/IntroScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { TrainingScene } from './scenes/TrainingScene';
import { CabinOneScene } from './scenes/CabinOneScene';
import { CabinTwoScene } from './scenes/CabinTwoScene';
import { CabinThreeScene } from './scenes/CabinThreeScene';
import { GameOverScene } from './scenes/GameOverScene';
import { installTrainingGameOverHook } from './gameOverHook';
import { installTrainingTerrainRefinement } from './trainingTerrainRefinement';
import { installTianaSideWalkRefinement } from './tianaSideWalkRefinement';
import { installTianaPhysicsRefinement } from './tianaPhysicsRefinement';
import { installLupeCharacterRefinement } from './lupeCharacterRefinement';
import { installCabinOneTransitionRefinement } from './cabinOneTransitionRefinement';
import { installHdRenderingRefinement } from './hdRenderingRefinement';
import { installArkanisTypography, waitForArkanisFont } from './arkanisTypography';

installArkanisTypography();
installTrainingGameOverHook();
installTrainingTerrainRefinement();
installTianaSideWalkRefinement();
installTianaPhysicsRefinement();
installLupeCharacterRefinement();
installCabinOneTransitionRefinement();
installHdRenderingRefinement();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'game',
  width: 1920,
  height: 1080,
  backgroundColor: '#111111',
  pixelArt: false,
  render: {
    antialias: true,
    antialiasGL: true,
    roundPixels: false,
    powerPreference: 'high-performance',
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR'
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    IntroScene,
    CharacterSelectScene,
    TrainingScene,
    CabinOneScene,
    CabinTwoScene,
    CabinThreeScene,
    GameOverScene
  ]
};

async function bootGame(): Promise<void> {
  await waitForArkanisFont();
  new Phaser.Game(config);
}

void bootGame();

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
import { installTrainingGridDebugOverlay } from './gridDebugOverlay';
import { installArkanisTypography, waitForArkanisFont } from './arkanisTypography';

installArkanisTypography();
installTrainingGameOverHook();
installTrainingTerrainRefinement();
installTianaSideWalkRefinement();
installTianaPhysicsRefinement();
installLupeCharacterRefinement();
installCabinOneTransitionRefinement();
installTrainingGridDebugOverlay();

const renderResolution = Math.min(window.devicePixelRatio || 1, 2);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  resolution: renderResolution,
  backgroundColor: '#111111',
  pixelArt: false,
  render: {
    antialias: true,
    antialiasGL: true,
    roundPixels: false
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

import * as Phaser from 'phaser';
import './style.css';
import { IntroScene } from './scenes/IntroScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { TrainingScene } from './scenes/TrainingScene';
import { GameOverScene } from './scenes/GameOverScene';
import { installTrainingGameOverHook } from './gameOverHook';
import { installTrainingGridDebugOverlay } from './gridDebugOverlay';
import { installTrainingTerrainRefinement } from './trainingTerrainRefinement';
import { installTianaSideWalkRefinement } from './tianaSideWalkRefinement';

installTrainingGameOverHook();
installTrainingGridDebugOverlay();
installTrainingTerrainRefinement();
installTianaSideWalkRefinement();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#111111',
  pixelArt: true,
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
  scene: [IntroScene, CharacterSelectScene, TrainingScene, GameOverScene]
};

new Phaser.Game(config);

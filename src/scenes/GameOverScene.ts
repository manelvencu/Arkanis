import * as Phaser from 'phaser';
import type { CharacterId } from '../gameData';

interface GameOverData {
  characterId: CharacterId;
}

const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 540;
const HD_SCALE = 2;

export class GameOverScene extends Phaser.Scene {
  private characterId: CharacterId = 'tiana';
  private restarting = false;

  constructor() {
    super('GameOverScene');
  }

  init(data: GameOverData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.restarting = false;
  }

  preload(): void {
    this.load.image('game-over-image', './assets/ui/game-over.png');
  }

  create(): void {
    const width = LOGICAL_WIDTH;
    const height = LOGICAL_HEIGHT;
    this.cameras.main.setZoom(HD_SCALE);

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.58)
      .setDepth(3000);

    const glow = this.add.image(width / 2, height / 2, 'game-over-image')
      .setDisplaySize(430, 430)
      .setTint(0xff7a18)
      .setAlpha(0.2)
      .setDepth(3001);

    const gameOver = this.add.image(width / 2, height / 2, 'game-over-image')
      .setDisplaySize(410, 410)
      .setDepth(3002);

    const baseScaleX = gameOver.scaleX;
    const baseScaleY = gameOver.scaleY;
    const glowScaleX = glow.scaleX;
    const glowScaleY = glow.scaleY;

    this.tweens.add({
      targets: gameOver,
      y: height / 2 - 5,
      scaleX: baseScaleX * 1.025,
      scaleY: baseScaleY * 0.985,
      alpha: 0.86,
      duration: 210,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: glow,
      scaleX: glowScaleX * 1.08,
      scaleY: glowScaleY * 1.08,
      alpha: 0.08,
      duration: 145,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.input.keyboard?.once('keydown-SPACE', () => this.restartTraining());
    this.time.delayedCall(60_000, () => this.restartTraining());
  }

  private restartTraining(): void {
    if (this.restarting) return;
    this.restarting = true;

    this.scene.stop('TrainingScene');
    this.scene.start('TrainingScene', { characterId: this.characterId });
  }
}

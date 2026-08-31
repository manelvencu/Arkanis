import * as Phaser from 'phaser';
import type { CharacterId } from '../gameData';

interface GameOverData {
  characterId: CharacterId;
}

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
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    const imageSize = Math.min(width * 0.44, height * 0.76);

    // GameOverScene es una escena de interfaz independiente: no debe heredar
    // coordenadas lógicas ni zoom del mundo de entrenamiento.
    this.cameras.main.setZoom(1);
    this.cameras.main.setScroll(0, 0);

    this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.58)
      .setScrollFactor(0)
      .setDepth(3000);

    const glow = this.add.image(centerX, centerY, 'game-over-image')
      .setDisplaySize(imageSize * 1.05, imageSize * 1.05)
      .setTint(0xff7a18)
      .setAlpha(0.2)
      .setScrollFactor(0)
      .setDepth(3001);

    const gameOver = this.add.image(centerX, centerY, 'game-over-image')
      .setDisplaySize(imageSize, imageSize)
      .setScrollFactor(0)
      .setDepth(3002);

    const baseScaleX = gameOver.scaleX;
    const baseScaleY = gameOver.scaleY;
    const glowScaleX = glow.scaleX;
    const glowScaleY = glow.scaleY;

    this.tweens.add({
      targets: gameOver,
      y: centerY - 10,
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
    this.input.once('pointerdown', () => this.restartTraining());
    this.time.delayedCall(60_000, () => this.restartTraining());
  }

  private restartTraining(): void {
    if (this.restarting) return;
    this.restarting = true;

    this.scene.stop('TrainingScene');
    this.scene.start('TrainingScene', { characterId: this.characterId });
  }
}

import * as Phaser from 'phaser';

/** Cinemática de obtención del fragmento del Desierto de Arkanis. */
export class DesertJewelRevealScene extends Phaser.Scene {
  private readyToContinue = false;

  constructor() {
    super('DesertJewelRevealScene');
  }

  preload(): void {
    this.load.image('desert-jewel-shard', './assets/story/trozo-desierto-arkanis.png');
    this.load.image('desert-jewel-assembled', './assets/story/Joya-trozos-1-3-4.png');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    this.cameras.main.setBackgroundColor('#000000');

    const shard = this.add.image(width / 2, height / 2, 'desert-jewel-shard');
    const shardFit = Math.min(width / shard.width, height / shard.height);
    shard.setScale(0.001).setAlpha(0);

    const assembled = this.add.image(width / 2, height / 2, 'desert-jewel-assembled');
    const assembledFit = Math.min(width / assembled.width, height / assembled.height);
    assembled.setScale(assembledFit).setAlpha(0);

    // Primera etapa: aparece el fragmento desde un punto y crece hasta
    // ocupar el área visible sin distorsionar su proporción.
    this.tweens.add({
      targets: shard,
      scaleX: shardFit,
      scaleY: shardFit,
      alpha: 1,
      duration: 1800,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.time.delayedCall(450, () => {
          // La pieza del desierto corresponde al sector inferior derecho
          // (posición 4 en sentido horario). La joya final se revela mientras
          // el fragmento viaja a ese sector y se funde suavemente con ella.
          this.tweens.add({
            targets: assembled,
            alpha: 1,
            duration: 1250,
            ease: 'Sine.easeInOut'
          });
          this.tweens.add({
            targets: shard,
            x: width * 0.66,
            y: height * 0.66,
            scaleX: shardFit * 0.22,
            scaleY: shardFit * 0.22,
            alpha: 0,
            duration: 1250,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
              shard.destroy();
              this.readyToContinue = true;
            }
          });
        });
      }
    });

    const continueGame = () => {
      if (!this.readyToContinue) return;
      this.readyToContinue = false;
      this.scene.resume('MazeScene');
      this.scene.stop();
    };

    this.input.keyboard?.on('keydown', continueGame);
    this.input.on('pointerdown', continueGame);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', continueGame);
      this.input.off('pointerdown', continueGame);
    });
  }
}

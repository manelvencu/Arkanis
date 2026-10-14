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

    // El PNG del trozo tiene transparencia asimétrica: el dibujo real está
    // en x430..838, y371..741 de un lienzo de 846x800. Corregimos su
    // desplazamiento para encajarlo en el hueco inferior derecho de la joya.
    const shardArtOffsetX = (430 + 838) / 2 - shard.width / 2;
    const shardArtOffsetY = (371 + 741) / 2 - shard.height / 2;
    const targetX = width / 2 + (824 - assembled.width / 2) * assembledFit;
    const targetY = height / 2 + (978 - assembled.height / 2) * assembledFit;
    const finalScale = assembledFit * 0.98;
    const finalImageX = targetX - shardArtOffsetX * finalScale;
    const finalImageY = targetY - shardArtOffsetY * finalScale;

    // Humo dorado semitransparente, sin assets adicionales ni flashes opacos.
    const raiseDust = () => {
      for (let index = 0; index < 22; index += 1) {
        const angle = (index / 22) * Math.PI * 2;
        const radius = 24 + (index % 5) * 15;
        const dust = this.add.circle(
          targetX + Math.cos(angle) * radius,
          targetY + Math.sin(angle) * radius,
          18 + (index % 4) * 12,
          index % 3 === 0 ? 0xf2ce79 : 0xb79b65,
          0.0
        ).setDepth(10);
        this.tweens.add({
          targets: dust,
          x: dust.x + Math.cos(angle) * (70 + index % 4 * 20),
          y: dust.y - 55 - index % 5 * 13,
          scale: 1.65,
          alpha: { from: 0.25, to: 0 },
          duration: 1200 + index % 4 * 110,
          ease: 'Sine.easeOut',
          onComplete: () => dust.destroy()
        });
      }
    };

    this.tweens.add({
      targets: shard,
      scaleX: shardFit,
      scaleY: shardFit,
      alpha: 1,
      duration: 1800,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.time.delayedCall(400, () => {
          raiseDust();
          // El humo oculta el punto de unión mientras el trozo converge
          // en tamaño y posición con el sector 4 de la joya completa.
          this.tweens.add({
            targets: shard,
            x: finalImageX,
            y: finalImageY,
            scaleX: finalScale,
            scaleY: finalScale,
            duration: 1350,
            ease: 'Cubic.easeInOut'
          });
          this.time.delayedCall(460, () => {
            this.tweens.add({
              targets: assembled,
              alpha: 1,
              duration: 1050,
              ease: 'Sine.easeInOut'
            });
            this.tweens.add({
              targets: shard,
              alpha: 0,
              duration: 1050,
              ease: 'Sine.easeInOut',
              onComplete: () => {
                shard.destroy();
                this.readyToContinue = true;
              }
            });
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

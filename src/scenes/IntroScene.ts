import * as Phaser from 'phaser';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  preload(): void {
    this.load.image('logo-arkanis', './assets/ui/logo-arkanis.png');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x080711);

    const logo = this.add.container(width / 2, height / 2);
    const logoImage = this.add.image(0, -24, 'logo-arkanis');
    logoImage.setScale(Math.min(620 / logoImage.width, 260 / logoImage.height));

    const subtitle = this.add.text(0, logoImage.y + logoImage.displayHeight / 2 + 32, 'Creado por: Los Macanos', {
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: '21px',
      color: '#e8c474',
      fontStyle: 'italic',
      stroke: '#1b0e06',
      strokeThickness: 4,
      shadow: {
        offsetX: 3,
        offsetY: 4,
        color: '#000000',
        blur: 5,
        fill: true
      }
    }).setOrigin(0.5);

    logo.add([logoImage, subtitle]);

    const ambientTween = this.tweens.add({
      targets: logo,
      y: height / 2 - 8,
      scale: 1.015,
      duration: 2400,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    let isLeaving = false;
    const leaveIntro = (): void => {
      if (isLeaving) return;
      isLeaving = true;
      ambientTween.stop();

      this.tweens.add({
        targets: logo,
        scale: 8,
        duration: 1250,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          this.scene.start('CharacterSelectScene');
        }
      });
    };

    this.input.keyboard?.once('keydown', leaveIntro);
    this.input.once('pointerdown', leaveIntro);
  }
}

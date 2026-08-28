import * as Phaser from 'phaser';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x100b1b);
    this.add.circle(width / 2, height / 2, 235, 0x6f3515, 0.18);
    this.add.circle(width / 2, height / 2, 175, 0xd29a37, 0.08)
      .setStrokeStyle(2, 0xd8a744, 0.35);

    const logo = this.add.container(width / 2, height / 2);

    const title = this.add.text(0, -26, 'LAS TIERRAS DE ARKANIS', {
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: '50px',
      color: '#f4c85f',
      fontStyle: 'bold italic',
      stroke: '#2b1609',
      strokeThickness: 8,
      align: 'center',
      shadow: {
        offsetX: 5,
        offsetY: 7,
        color: '#000000',
        blur: 8,
        fill: true,
        stroke: true
      }
    }).setOrigin(0.5).setLetterSpacing(2);

    const ornament = this.add.rectangle(0, 25, 520, 3, 0xd39a36)
      .setStrokeStyle(1, 0x3b210d);

    const subtitle = this.add.text(0, 58, 'Creado por: Los Macanos', {
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: '22px',
      color: '#ffe5a1',
      fontStyle: 'italic',
      stroke: '#241307',
      strokeThickness: 4,
      shadow: {
        offsetX: 3,
        offsetY: 4,
        color: '#000000',
        blur: 5,
        fill: true
      }
    }).setOrigin(0.5);

    logo.add([title, ornament, subtitle]);

    this.tweens.add({
      targets: logo,
      scale: 9,
      duration: 4200,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.scene.start('CharacterSelectScene');
      }
    });
  }
}

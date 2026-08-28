import * as Phaser from 'phaser';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x080711);

    const logo = this.add.container(width / 2, height / 2);

    const overline = this.add.text(0, -78, 'LAS TIERRAS DE', {
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: '27px',
      color: '#e1af48',
      fontStyle: 'bold',
      stroke: '#1b0e06',
      strokeThickness: 5,
      align: 'center',
      shadow: {
        offsetX: 3,
        offsetY: 4,
        color: '#000000',
        blur: 5,
        fill: true,
        stroke: true
      }
    }).setOrigin(0.5).setLetterSpacing(6);

    const title = this.add.text(0, 0, 'ARKANIS', {
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: '104px',
      color: '#f6c95c',
      fontStyle: 'bold italic',
      stroke: '#241205',
      strokeThickness: 11,
      align: 'center',
      shadow: {
        offsetX: 7,
        offsetY: 10,
        color: '#000000',
        blur: 10,
        fill: true,
        stroke: true
      }
    }).setOrigin(0.5).setLetterSpacing(3);

    const subtitle = this.add.text(0, 82, 'Creado por: Los Macanos', {
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

    logo.add([overline, title, subtitle]);

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

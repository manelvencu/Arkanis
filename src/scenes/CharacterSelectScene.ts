import * as Phaser from 'phaser';
import { characters } from '../gameData';
import { portraitData } from '../assets/portraits';

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super('CharacterSelectScene');
  }

  preload(): void {
    characters.forEach((character) => {
      this.load.image(`portrait-${character.id}`, portraitData[character.id]);
    });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x161326);

    this.add.text(width / 2, 28, 'LAS TIERRAS DE', {
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: '17px',
      color: '#d7bd72',
      fontStyle: 'bold',
      stroke: '#211507',
      strokeThickness: 3,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 3,
        fill: true
      }
    }).setOrigin(0.5).setLetterSpacing(3);

    this.add.text(width / 2, 63, 'ARKANIS', {
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: '43px',
      color: '#e4bd58',
      fontStyle: 'bold italic',
      stroke: '#211507',
      strokeThickness: 7,
      shadow: {
        offsetX: 4,
        offsetY: 5,
        color: '#000000',
        blur: 5,
        fill: true
      }
    }).setOrigin(0.5).setLetterSpacing(2);

    this.add.text(width / 2, 101, 'Elige tu personaje', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const positions = [
      { x: width / 2 - 125, y: 210 },
      { x: width / 2 + 125, y: 210 },
      { x: width / 2 - 125, y: 408 },
      { x: width / 2 + 125, y: 408 }
    ];

    characters.forEach((character, index) => {
      const { x, y } = positions[index];

      const card = this.add.rectangle(x, y, 210, 180, 0x282238)
        .setStrokeStyle(4, 0x82788f)
        .setInteractive({ useHandCursor: true });

      const portrait = this.add.image(x, y - 12, `portrait-${character.id}`)
        .setDisplaySize(150, 150);

      const name = this.add.text(x, y + 74, character.name, {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#f4f0f8',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const select = (): void => {
        card.setStrokeStyle(6, 0xf4c542);
        portrait.setScale(0.97);
        name.setColor('#f8d96b');
      };

      const unselect = (): void => {
        card.setStrokeStyle(4, 0x82788f);
        portrait.setDisplaySize(150, 150);
        name.setColor('#f4f0f8');
      };

      card.on('pointerover', select);
      card.on('pointerout', unselect);
      card.on('pointerdown', () => {
        select();
        this.time.delayedCall(120, () => {
          this.scene.start('TrainingScene', { characterId: character.id });
        });
      });
    });

    this.add.text(width / 2, height - 18, 'Haz clic o toca un personaje para comenzar', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#c9c1d2'
    }).setOrigin(0.5);
  }
}

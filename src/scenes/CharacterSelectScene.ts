import * as Phaser from 'phaser';
import { characters } from '../gameData';
import { portraitData } from '../assets/portraits';

const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 540;
const HD_SCALE = 2;

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super('CharacterSelectScene');
  }

  preload(): void {
    this.load.image('logo-arkanis', './assets/ui/logo-arkanis.png');

    characters.forEach((character) => {
      this.load.image(`portrait-${character.id}`, portraitData[character.id]);
    });
  }

  create(): void {
    const width = LOGICAL_WIDTH;
    const height = LOGICAL_HEIGHT;
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setZoom(HD_SCALE);
    this.cameras.main.centerOn(width / 2, height / 2);

    this.add.rectangle(width / 2, height / 2, width, height, 0x161326);

    const logo = this.add.image(width / 2, 47, 'logo-arkanis');
    logo.setScale(Math.min(330 / logo.width, 72 / logo.height));

    this.add.text(width / 2, 101, 'Selección de jugador', {
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

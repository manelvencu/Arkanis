import * as Phaser from 'phaser';
import { characters } from '../gameData';

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super('CharacterSelectScene');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x16351f);

    this.add.text(width / 2, 72, 'LAS TIERRAS DE ARKANIS', {
      fontFamily: 'Arial',
      fontSize: '34px',
      color: '#f5e7a1',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, 118, 'Elige tu personaje', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const startX = width / 2 - 255;
    const y = height / 2 + 20;

    characters.forEach((character, index) => {
      const x = startX + index * 170;
      const card = this.add.rectangle(x, y, 130, 180, 0xefe2bf)
        .setStrokeStyle(4, 0x5c4328)
        .setInteractive({ useHandCursor: true });

      this.add.circle(x, y - 30, 34, character.placeholderColor)
        .setStrokeStyle(3, 0xffffff);

      this.add.text(x, y + 45, character.name, {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#2b2116',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      card.on('pointerover', () => card.setFillStyle(0xfff2c9));
      card.on('pointerout', () => card.setFillStyle(0xefe2bf));
      card.on('pointerdown', () => {
        this.scene.start('TrainingScene', { characterId: character.id });
      });
    });

    this.add.text(width / 2, height - 42, 'Sprites provisionales · El aspecto definitivo llegará después', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#d9d9d9'
    }).setOrigin(0.5);
  }
}

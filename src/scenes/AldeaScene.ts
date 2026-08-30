import * as Phaser from 'phaser';

interface AldeaData {
  characterId?: string;
}

export class AldeaScene extends Phaser.Scene {
  private characterId = 'tiana';

  constructor() {
    super('AldeaScene');
  }

  init(data: AldeaData): void {
    this.characterId = data.characterId ?? 'tiana';
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#080711');
    this.cameras.main.fadeIn(700, 8, 7, 17);

    this.add.text(width / 2, height / 2 - 30, 'LA ALDEA', {
      fontFamily: 'IM Fell English, Georgia, serif',
      fontSize: '76px',
      color: '#f3d889',
      stroke: '#21160d',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 70, 'Primer mundo de las Tierras de Arkanis', {
      fontFamily: 'IM Fell English, Georgia, serif',
      fontSize: '34px',
      color: '#d8c99b'
    }).setOrigin(0.5);

    void this.characterId;
  }
}

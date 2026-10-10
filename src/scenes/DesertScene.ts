import * as Phaser from 'phaser';
import type { CharacterId } from '../gameData';

interface DesertSceneData {
  characterId?: CharacterId;
}

/**
 * Base provisional del siguiente mundo: El Desierto de Mil Soles.
 *
 * La escena existe para cerrar correctamente la transición desde el mapa del mundo.
 * Su diseño jugable, arte, límites y objetivos se definirán en el siguiente bloque.
 */
export class DesertScene extends Phaser.Scene {
  private characterId: CharacterId = 'tiana';

  constructor() {
    super('DesertScene');
  }

  init(data: DesertSceneData): void {
    this.characterId = data.characterId ?? 'tiana';
  }

  create(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#b7792f');

    this.add.rectangle(width / 2, height / 2, width, height, 0xb7792f)
      .setDepth(0);

    this.add.text(width / 2, height / 2 - 30, 'El Desierto de Mil Soles', {
      fontFamily: 'IM Fell English, Georgia, serif',
      fontSize: '68px',
      color: '#f7df9b',
      stroke: '#4b2a10',
      strokeThickness: 5,
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 55, 'Nuevo mundo preparado para comenzar su diseño', {
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: '28px',
      color: '#5b3215',
      align: 'center'
    }).setOrigin(0.5);

    void this.characterId;
    this.cameras.main.fadeIn(700, 8, 5, 2);
  }
}

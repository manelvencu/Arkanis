import * as Phaser from 'phaser';

const GRID_COLUMNS = 30;
const GRID_ROWS = 15;

export interface InteriorGridGuide {
  container: Phaser.GameObjects.Container;
  toggle: () => void;
}

/**
 * Rejilla visual temporal para definir las futuras zonas de colisión de interiores.
 * Se muestra por defecto y puede ocultarse/mostrarse con la tecla G.
 *
 * Coordenadas de referencia:
 * - columnas C01..C30
 * - filas F01..F15
 */
export function createInteriorGridGuide(
  scene: Phaser.Scene,
  width = 960,
  height = 540
): InteriorGridGuide {
  const cellWidth = width / GRID_COLUMNS;
  const cellHeight = height / GRID_ROWS;
  const container = scene.add.container(0, 0).setDepth(850);
  const graphics = scene.add.graphics();

  // Una ligera sombra ayuda a ver las líneas tanto sobre madera clara como sobre piedra oscura.
  for (let column = 0; column <= GRID_COLUMNS; column += 1) {
    const x = column * cellWidth;
    const major = column % 5 === 0;
    graphics.lineStyle(major ? 2 : 1, 0xff4a4a, major ? 0.85 : 0.52);
    graphics.lineBetween(x, 0, x, height);
  }

  for (let row = 0; row <= GRID_ROWS; row += 1) {
    const y = row * cellHeight;
    const major = row % 5 === 0;
    graphics.lineStyle(major ? 2 : 1, 0x4f7dff, major ? 0.85 : 0.52);
    graphics.lineBetween(0, y, width, y);
  }

  container.add(graphics);

  for (let column = 0; column < GRID_COLUMNS; column += 1) {
    const label = scene.add.text(column * cellWidth + cellWidth / 2, 4, `C${String(column + 1).padStart(2, '0')}`, {
      fontFamily: 'Arial',
      fontSize: '8px',
      color: '#fff4f4',
      backgroundColor: '#6b1111',
      padding: { x: 2, y: 1 }
    }).setOrigin(0.5, 0);
    container.add(label);
  }

  for (let row = 0; row < GRID_ROWS; row += 1) {
    const label = scene.add.text(3, row * cellHeight + cellHeight / 2, `F${String(row + 1).padStart(2, '0')}`, {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#eef3ff',
      backgroundColor: '#173b86',
      padding: { x: 2, y: 1 }
    }).setOrigin(0, 0.5);
    container.add(label);
  }

  const hint = scene.add.text(width - 8, height - 8, 'GRID C01–C30 / F01–F15 · G mostrar/ocultar', {
    fontFamily: 'Arial',
    fontSize: '11px',
    color: '#ffffff',
    backgroundColor: '#111111',
    padding: { x: 5, y: 3 }
  }).setOrigin(1, 1);
  container.add(hint);

  const toggle = (): void => {
    container.setVisible(!container.visible);
  };

  scene.input.keyboard?.on('keydown-G', toggle);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.keyboard?.off('keydown-G', toggle);
  });

  return { container, toggle };
}

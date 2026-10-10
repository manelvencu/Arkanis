import * as Phaser from 'phaser';
import type { CharacterId } from '../gameData';

interface DesertSceneData {
  characterId?: CharacterId;
}

const GRID_SIZE = 32;
const WORLD_COLUMNS = 90;
const WORLD_ROWS = 22;
const WORLD_WIDTH = WORLD_COLUMNS * GRID_SIZE;
const WORLD_HEIGHT = WORLD_ROWS * GRID_SIZE;
const GRID_TEXTURE_KEY = 'desert-grid-guide';
const CAMERA_SPEED = 520;

/**
 * Primera base de El Desierto de Mil Soles.
 *
 * Mundo horizontal grande:
 * - 90 columnas
 * - 22 filas
 * - celdas de 32×32 px
 * - 2880×704 px lógicos
 *
 * Esta versión es deliberadamente provisional: solo sirve para validar
 * escala, longitud del mundo y futura distribución de retos.
 */
export class DesertScene extends Phaser.Scene {
  private characterId: CharacterId = 'tiana';
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('DesertScene');
  }

  init(data: DesertSceneData): void {
    this.characterId = data.characterId ?? 'tiana';
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#b98245');
    this.cameras.main.setZoom(2);
    this.cameras.main.setScroll(0, Math.max(0, (WORLD_HEIGHT - 540) / 2));

    this.createProvisionalGround();
    this.createGridGuide();

    this.cursors = this.input.keyboard?.createCursorKeys();

    this.add.text(18, 18, 'EL DESIERTO DE MIL SOLES · 90 × 22', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#fff3c7',
      stroke: '#3a210d',
      strokeThickness: 3
    })
      .setScrollFactor(0)
      .setDepth(1000);

    this.add.text(18, 42, 'Guía provisional · usa ← → para recorrer el tablero', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#f3d79c',
      stroke: '#3a210d',
      strokeThickness: 2
    })
      .setScrollFactor(0)
      .setDepth(1000);

    void this.characterId;
    this.cameras.main.fadeIn(700, 8, 5, 2);
  }

  update(_time: number, delta: number): void {
    if (!this.cursors) return;

    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown) dx -= 1;
    if (this.cursors.right.isDown) dx += 1;
    if (this.cursors.up.isDown) dy -= 1;
    if (this.cursors.down.isDown) dy += 1;

    if (dx === 0 && dy === 0) return;

    const direction = new Phaser.Math.Vector2(dx, dy).normalize();
    const distance = CAMERA_SPEED * (delta / 1000);

    this.cameras.main.scrollX += direction.x * distance;
    this.cameras.main.scrollY += direction.y * distance;
  }

  private createProvisionalGround(): void {
    this.add.rectangle(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      WORLD_WIDTH,
      WORLD_HEIGHT,
      0xb98245
    ).setDepth(0);

    // Variación suave de bandas para que el tamaño del mundo se perciba mejor
    // sin condicionar todavía el diseño final del desierto.
    for (let column = 0; column < WORLD_COLUMNS; column += 6) {
      this.add.rectangle(
        column * GRID_SIZE + GRID_SIZE * 3,
        WORLD_HEIGHT / 2,
        GRID_SIZE * 6,
        WORLD_HEIGHT,
        column % 12 === 0 ? 0xc38b4c : 0xb77c3e,
        0.22
      ).setDepth(0.1);
    }
  }

  private createGridGuide(): void {
    if (this.textures.exists(GRID_TEXTURE_KEY)) {
      this.textures.remove(GRID_TEXTURE_KEY);
    }

    const texture = this.textures.createCanvas(GRID_TEXTURE_KEY, WORLD_WIDTH, WORLD_HEIGHT);
    if (!texture) return;

    const context = texture.context;
    context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    context.textBaseline = 'top';
    context.font = '7px Arial';

    for (let column = 0; column <= WORLD_COLUMNS; column += 1) {
      const x = column * GRID_SIZE + 0.5;
      context.beginPath();
      context.strokeStyle = column % 5 === 0
        ? 'rgba(255,244,180,0.62)'
        : 'rgba(255,255,255,0.28)';
      context.lineWidth = column % 5 === 0 ? 1.5 : 1;
      context.moveTo(x, 0);
      context.lineTo(x, WORLD_HEIGHT);
      context.stroke();
    }

    for (let row = 0; row <= WORLD_ROWS; row += 1) {
      const y = row * GRID_SIZE + 0.5;
      context.beginPath();
      context.strokeStyle = row % 5 === 0
        ? 'rgba(255,244,180,0.62)'
        : 'rgba(255,255,255,0.28)';
      context.lineWidth = row % 5 === 0 ? 1.5 : 1;
      context.moveTo(0, y);
      context.lineTo(WORLD_WIDTH, y);
      context.stroke();
    }

    for (let row = 1; row <= WORLD_ROWS; row += 1) {
      for (let column = 1; column <= WORLD_COLUMNS; column += 1) {
        const x = (column - 1) * GRID_SIZE + 2;
        const y = (row - 1) * GRID_SIZE + 2;
        const label = `C${String(column).padStart(2, '0')}/F${String(row).padStart(2, '0')}`;

        context.lineWidth = 2;
        context.strokeStyle = 'rgba(50,28,12,0.78)';
        context.strokeText(label, x, y);
        context.fillStyle = 'rgba(255,240,185,0.88)';
        context.fillText(label, x, y);
      }
    }

    texture.refresh();

    this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, GRID_TEXTURE_KEY)
      .setDepth(10)
      .setAlpha(0.95);
  }
}

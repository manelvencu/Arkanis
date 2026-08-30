import * as Phaser from 'phaser';
import type { CharacterId } from '../gameData';

interface DevMenuData {
  sourceSceneKey?: string;
  characterId?: CharacterId;
}

interface DevEntry {
  label: string;
  sceneKey: string;
  data?: Record<string, unknown>;
}

interface DevSection {
  title: string;
  entries: DevEntry[];
}

const VIEW_WIDTH = 1920;
const VIEW_HEIGHT = 1080;
const TOP_MARGIN = 150;
const BOTTOM_MARGIN = 80;
const ROW_HEIGHT = 58;
const SECTION_GAP = 34;

export class DevMenuScene extends Phaser.Scene {
  private sourceSceneKey?: string;
  private characterId: CharacterId = 'tiana';
  private listContainer?: Phaser.GameObjects.Container;
  private contentHeight = 0;
  private scrollY = 0;

  constructor() {
    super('DevMenuScene');
  }

  init(data: DevMenuData): void {
    this.sourceSceneKey = data.sourceSceneKey;
    this.characterId = data.characterId ?? 'tiana';
    this.scrollY = 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#050505');

    this.add.text(70, 48, 'MENÚ DE DESARROLLO', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '42px',
      color: '#ffffff',
      fontStyle: 'bold'
    });

    this.add.text(70, 102, 'Selecciona una pantalla · Rueda / ↑↓ para desplazarte · ESC para volver', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#aaaaaa'
    });

    const sections = this.buildSections();
    const container = this.add.container(0, TOP_MARGIN);
    this.listContainer = container;

    let y = 0;
    sections.forEach((section) => {
      const heading = this.add.text(90, y, section.title, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#d6b96e',
        fontStyle: 'bold'
      });
      container.add(heading);
      y += 42;

      section.entries.forEach((entry) => {
        const item = this.add.text(110, y, entry.label, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '30px',
          color: '#f2f2f2',
          backgroundColor: '#171717',
          padding: { left: 18, right: 18, top: 10, bottom: 10 },
          fixedWidth: 820
        })
          .setInteractive({ useHandCursor: true });

        item.on('pointerover', () => item.setStyle({ backgroundColor: '#303030', color: '#ffffff' }));
        item.on('pointerout', () => item.setStyle({ backgroundColor: '#171717', color: '#f2f2f2' }));
        item.on('pointerdown', () => this.goTo(entry));

        container.add(item);
        y += ROW_HEIGHT;
      });

      y += SECTION_GAP;
    });

    this.contentHeight = y;
    this.applyScroll();

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      this.scrollBy(dy * 0.7);
    });

    this.input.keyboard?.on('keydown-UP', () => this.scrollBy(-70));
    this.input.keyboard?.on('keydown-DOWN', () => this.scrollBy(70));
    this.input.keyboard?.on('keydown-PAGEUP', () => this.scrollBy(-420));
    this.input.keyboard?.on('keydown-PAGEDOWN', () => this.scrollBy(420));
    this.input.keyboard?.once('keydown-ESC', () => this.closeMenu());
  }

  private buildSections(): DevSection[] {
    const characterData = { characterId: this.characterId };
    return [
      {
        title: 'INICIO',
        entries: [
          { label: 'Intro', sceneKey: 'IntroScene' },
          { label: 'Selección de personaje', sceneKey: 'CharacterSelectScene' }
        ]
      },
      {
        title: 'ENTRENAMIENTO',
        entries: [
          { label: 'Zona de entrenamiento', sceneKey: 'TrainingScene', data: characterData },
          { label: 'Cabaña 1', sceneKey: 'CabinOneScene', data: characterData },
          { label: 'Cabaña 2', sceneKey: 'CabinTwoScene', data: characterData },
          { label: 'Cabaña 3', sceneKey: 'CabinThreeScene', data: characterData }
        ]
      },
      {
        title: 'HISTORIA',
        entries: [
          { label: 'Secuencia joya + mapa', sceneKey: 'WorldMapScene', data: characterData },
          { label: 'Mapa de Arkanis directamente', sceneKey: 'WorldMapScene', data: { ...characterData, startAtMap: true } }
        ]
      },
      {
        title: 'MUNDO 1 — LA ALDEA',
        entries: [
          { label: 'Entrada a La Aldea', sceneKey: 'AldeaScene', data: characterData }
        ]
      }
    ];
  }

  private scrollBy(delta: number): void {
    const visibleHeight = VIEW_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;
    const maxScroll = Math.max(0, this.contentHeight - visibleHeight);
    this.scrollY = Phaser.Math.Clamp(this.scrollY + delta, 0, maxScroll);
    this.applyScroll();
  }

  private applyScroll(): void {
    this.listContainer?.setY(TOP_MARGIN - this.scrollY);
  }

  private closeMenu(): void {
    const source = this.sourceSceneKey;
    this.scene.stop();
    if (source && this.scene.isSleeping(source)) {
      this.scene.wake(source);
    }
  }

  private goTo(entry: DevEntry): void {
    const source = this.sourceSceneKey;
    if (source && this.scene.isActive(source)) this.scene.stop(source);
    if (source && this.scene.isSleeping(source)) this.scene.stop(source);
    this.scene.start(entry.sceneKey, entry.data ?? {});
  }
}

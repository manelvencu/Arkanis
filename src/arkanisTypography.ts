import * as Phaser from 'phaser';

export const ARKANIS_FONT_FAMILY = '"IM Fell English", Georgia, serif';

type TextFactory = Phaser.GameObjects.GameObjectFactory['text'];

type TextFactoryPrototype = Phaser.GameObjects.GameObjectFactory & {
  __arkanisTypographyInstalled?: boolean;
};

export function installArkanisTypography(): void {
  const prototype = Phaser.GameObjects.GameObjectFactory.prototype as TextFactoryPrototype;
  if (prototype.__arkanisTypographyInstalled) return;

  const originalText = prototype.text as TextFactory;
  prototype.__arkanisTypographyInstalled = true;

  prototype.text = function textWithArkanisFont(
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    text: string | string[],
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ): Phaser.GameObjects.Text {
    return originalText.call(this, x, y, text, {
      ...(style ?? {}),
      fontFamily: ARKANIS_FONT_FAMILY
    });
  } as TextFactory;
}

export async function waitForArkanisFont(): Promise<void> {
  if (!document.fonts) return;

  try {
    await document.fonts.load('20px "IM Fell English"');
    await document.fonts.ready;
  } catch {
    // Si la fuente remota no carga, Phaser utilizará la cadena de respaldo.
  }
}

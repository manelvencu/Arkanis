import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const input = path.resolve(
  "public/assets/environment/interiors/source/cabin-interior-sheet-01.png"
);

const outputDir = path.resolve(
  "public/assets/environment/interiors/cabin"
);

const names = [
  "floor-wood-01.png",
  "wall-straight-01.png",
  "wall-corner-01.png",
  "door-wood-01.png",

  "window-wood-01.png",
  "bed-single-01.png",
  "bedside-table-01.png",
  "table-main-01.png",

  "chair-wood-01.png",
  "bookshelf-01.png",
  "wardrobe-01.png",
  "fireplace-01.png",

  "rug-01.png",
  "barrel-01.png",
  "crate-01.png",
  "plant-pot-01.png",
];

const COLS = 4;
const ROWS = 4;
const SHEET_WIDTH = 1280;
const SHEET_HEIGHT = 1280;
const CELL_WIDTH = 320;
const CELL_HEIGHT = 320;

if (!fs.existsSync(input)) {
  throw new Error(`No existe la lámina de origen: ${input}`);
}

const metadata = await sharp(input).metadata();

if (!metadata.width || !metadata.height) {
  throw new Error("No se pudo leer el tamaño de la lámina.");
}

if (metadata.width !== SHEET_WIDTH || metadata.height !== SHEET_HEIGHT) {
  throw new Error(
    `Tamaño de lámina incorrecto: ${metadata.width}x${metadata.height}. ` +
      `El estándar de Arkanis exige exactamente ${SHEET_WIDTH}x${SHEET_HEIGHT} px.`
  );
}

fs.mkdirSync(outputDir, { recursive: true });

console.log(`Lámina validada: ${metadata.width}x${metadata.height}`);
console.log(`Grid: ${COLS}x${ROWS}`);
console.log(`Celda: ${CELL_WIDTH}x${CELL_HEIGHT}`);

for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    const index = row * COLS + col;
    const left = col * CELL_WIDTH;
    const top = row * CELL_HEIGHT;

    await sharp(input)
      .extract({
        left,
        top,
        width: CELL_WIDTH,
        height: CELL_HEIGHT,
      })
      .png()
      .toFile(path.join(outputDir, names[index]));

    console.log(`✓ ${names[index]}`);
  }
}

console.log("\n16 assets generados correctamente.");

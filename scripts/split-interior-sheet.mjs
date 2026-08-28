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

fs.mkdirSync(outputDir, { recursive: true });

const image = sharp(input);
const metadata = await image.metadata();

if (!metadata.width || !metadata.height) {
  throw new Error("No se pudo leer el tamaño de la lámina.");
}

const cellWidth = Math.floor(metadata.width / COLS);
const cellHeight = Math.floor(metadata.height / ROWS);

console.log(`Lámina: ${metadata.width}x${metadata.height}`);
console.log(`Celda: ${cellWidth}x${cellHeight}`);

for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    const index = row * COLS + col;

    const left = col * cellWidth;
    const top = row * cellHeight;

    await sharp(input)
      .extract({
        left,
        top,
        width: cellWidth,
        height: cellHeight,
      })
      .png()
      .toFile(path.join(outputDir, names[index]));

    console.log(`✓ ${names[index]}`);
  }
}

console.log("\n16 assets generados correctamente.");

import { writeFileSync, mkdirSync } from 'node:fs';

const WORLD_COLUMNS = 80;
const WORLD_ROWS = 80;
const CENTER_ROOM = { left: 35, right: 46, top: 35, bottom: 46 };
const NORTH_GATE_COLUMNS = [40, 41, 42, 43];
const NORTH_GATE_ROW = 34;
const RETURN_BRIDGE_COLUMNS = [6, 7];
const RETURN_BRIDGE_ROWS = [76, 77];

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
const coarseKey = (x, y) => `${x}:${y}`;

function buildMazeWalkableCells() {
  const coarseSize = 39;
  const logicalCells = 19;
  const openCoarse = new Set();
  const visited = new Set();
  const random = createSeededRandom(0xA2C4D6E8);
  const stack = [{ x: 0, y: 18 }];
  visited.add(coarseKey(0, 18));
  const directions = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const coarseCellX = current.x * 2 + 1;
    const coarseCellY = current.y * 2 + 1;
    openCoarse.add(coarseKey(coarseCellX, coarseCellY));
    const candidates = directions.map(direction => ({
      x: current.x + direction.dx,
      y: current.y + direction.dy,
      direction
    })).filter(candidate =>
      candidate.x >= 0 && candidate.x < logicalCells &&
      candidate.y >= 0 && candidate.y < logicalCells &&
      !visited.has(coarseKey(candidate.x, candidate.y))
    );
    if (candidates.length === 0) { stack.pop(); continue; }
    const next = candidates[Math.floor(random() * candidates.length)];
    visited.add(coarseKey(next.x, next.y));
    const nextCoarseX = next.x * 2 + 1;
    const nextCoarseY = next.y * 2 + 1;
    openCoarse.add(coarseKey(coarseCellX + next.direction.dx, coarseCellY + next.direction.dy));
    openCoarse.add(coarseKey(nextCoarseX, nextCoarseY));
    stack.push({ x: next.x, y: next.y });
  }

  const walkable = new Set();
  for (let coarseY=0; coarseY<coarseSize; coarseY++) {
    for (let coarseX=0; coarseX<coarseSize; coarseX++) {
      if (!openCoarse.has(coarseKey(coarseX, coarseY))) continue;
      const baseColumn = 2 + coarseX * 2;
      const baseRow = 2 + coarseY * 2;
      for (let oy=0; oy<2; oy++) for (let ox=0; ox<2; ox++) {
        walkable.add(`${baseColumn+ox}:${baseRow+oy}`);
      }
    }
  }

  for (let row=75; row<=80; row++) for (let column=39; column<=42; column++) walkable.add(`${column}:${row}`);
  for (let row=72; row<=78; row++) for (let column=39; column<=42; column++) walkable.add(`${column}:${row}`);

  for (let row=CENTER_ROOM.top; row<=CENTER_ROOM.bottom; row++) {
    for (let column=CENTER_ROOM.left; column<=CENTER_ROOM.right; column++) walkable.add(`${column}:${row}`);
  }
  for (let column=CENTER_ROOM.left-1; column<=CENTER_ROOM.right+1; column++) {
    walkable.delete(`${column}:${CENTER_ROOM.top-1}`);
    walkable.delete(`${column}:${CENTER_ROOM.bottom+1}`);
  }
  for (let row=CENTER_ROOM.top-1; row<=CENTER_ROOM.bottom+1; row++) {
    walkable.delete(`${CENTER_ROOM.left-1}:${row}`);
    walkable.delete(`${CENTER_ROOM.right+1}:${row}`);
  }

  for (let row=47; row<=52; row++) for (let column=39; column<=42; column++) walkable.add(`${column}:${row}`);
  for (const column of NORTH_GATE_COLUMNS) walkable.add(`${column}:${NORTH_GATE_ROW}`);
  for (const row of RETURN_BRIDGE_ROWS) for (const column of RETURN_BRIDGE_COLUMNS) walkable.add(`${column}:${row}`);
  return walkable;
}

function render(labelled=false) {
  const walkable = buildMazeWalkableCells();
  const cell=12, margin=labelled?72:20;
  const width=WORLD_COLUMNS*cell+margin*2;
  const height=WORLD_ROWS*cell+margin*2;
  const has=(c,r)=>walkable.has(`${c}:${r}`);
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#faf8f1"/><g transform="translate(${margin},${margin})">`;

  if (labelled) {
    svg += '<g stroke="#e8e3d8" stroke-width="0.5">';
    for (let i=0;i<=80;i++) {
      const p=i*cell;
      svg += `<line x1="${p}" y1="0" x2="${p}" y2="${80*cell}"/><line x1="0" y1="${p}" x2="${80*cell}" y2="${p}"/>`;
    }
    svg += '</g>';
  }

  svg += '<g stroke="#1f2933" stroke-width="2" fill="none">';
  for (let r=1;r<=80;r++) for (let c=1;c<=80;c++) {
    if (!has(c,r)) continue;
    const x=(c-1)*cell, y=(r-1)*cell;
    if (!has(c,r-1)) svg += `<line x1="${x}" y1="${y}" x2="${x+cell}" y2="${y}"/>`;
    if (!has(c+1,r)) svg += `<line x1="${x+cell}" y1="${y}" x2="${x+cell}" y2="${y+cell}"/>`;
    if (!has(c,r+1)) svg += `<line x1="${x}" y1="${y+cell}" x2="${x+cell}" y2="${y+cell}"/>`;
    if (!has(c-1,r)) svg += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y+cell}"/>`;
  }
  svg += '</g>';

  if (labelled) {
    svg += '<g font-family="Arial,sans-serif" font-size="8" fill="#4b5563">';
    for (let c=1;c<=80;c+=5) {
      const x=(c-.5)*cell;
      svg += `<text x="${x}" y="-10" text-anchor="middle">C${String(c).padStart(2,'0')}</text><text x="${x}" y="${80*cell+22}" text-anchor="middle">C${String(c).padStart(2,'0')}</text>`;
    }
    for (let r=1;r<=80;r+=5) {
      const y=(r-.5)*cell+3;
      svg += `<text x="-14" y="${y}" text-anchor="end">F${String(r).padStart(2,'0')}</text><text x="${80*cell+14}" y="${y}">F${String(r).padStart(2,'0')}</text>`;
    }
    svg += '</g>';
  }

  svg += '</g></svg>';
  return svg;
}

mkdirSync('docs', { recursive: true });
writeFileSync('docs/maze-current.svg', render(false));
writeFileSync('docs/maze-current-labelled.svg', render(true));
console.log('Generated docs/maze-current.svg and docs/maze-current-labelled.svg');

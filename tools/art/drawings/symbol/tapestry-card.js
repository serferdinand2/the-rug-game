// Vectorized pixel-for-pixel from static/art/card-back/tapestry-24.png.
import { createCanvas, rect } from '../../painter.js';

/** @type {[string, number][]} */
const PALETTE = [['#120c1e', 1], ['#c6ad78', 1], ['#366d70', 1], ['#74492b', 1]];
const ROWS = [
  '24:-',
  '4:- 16:0 4:-',
  '4:- 1:0 14:1 1:0 4:-',
  '4:- 1:0 1:1 1:2 2:3 2:2 2:3 2:2 2:3 1:2 1:1 1:0 4:-',
  '4:- 1:0 1:1 2:2 2:3 2:2 2:3 2:2 2:3 1:1 1:0 4:-',
  '4:- 1:0 1:1 1:3 2:2 2:3 2:2 2:3 2:2 1:3 1:1 1:0 4:-',
  '4:- 1:0 1:1 2:3 2:2 2:3 2:2 2:3 2:2 1:1 1:0 4:-',
  '4:- 1:0 1:1 1:2 2:3 2:2 2:3 2:2 2:3 1:2 1:1 1:0 4:-',
  '4:- 1:0 1:1 2:2 2:3 2:2 2:3 2:2 2:3 1:1 1:0 4:-',
  '4:- 1:0 1:1 1:3 2:2 2:3 2:2 2:3 2:2 1:3 1:1 1:0 4:-',
  '4:- 1:0 1:1 2:3 2:2 2:3 2:2 2:3 2:2 1:1 1:0 4:-',
  '4:- 1:0 1:1 1:2 2:3 2:2 2:3 2:2 2:3 1:2 1:1 1:0 4:-',
  '4:- 1:0 1:1 2:2 2:3 2:2 2:3 2:2 2:3 1:1 1:0 4:-',
  '4:- 1:0 1:1 1:3 2:2 2:3 2:2 2:3 2:2 1:3 1:1 1:0 4:-',
  '4:- 1:0 1:1 2:3 2:2 2:3 2:2 2:3 2:2 1:1 1:0 4:-',
  '4:- 1:0 1:1 1:2 2:3 2:2 2:3 2:2 2:3 1:2 1:1 1:0 4:-',
  '4:- 1:0 1:1 2:2 2:3 2:2 2:3 2:2 2:3 1:1 1:0 4:-',
  '4:- 1:0 1:1 1:3 2:2 2:3 2:2 2:3 2:2 1:3 1:1 1:0 4:-',
  '4:- 1:0 1:1 2:3 2:2 2:3 2:2 2:3 2:2 1:1 1:0 4:-',
  '4:- 1:0 1:1 1:2 2:3 2:2 2:3 2:2 2:3 1:2 1:1 1:0 4:-',
  '4:- 1:0 1:1 2:2 2:3 2:2 2:3 2:2 2:3 1:1 1:0 4:-',
  '4:- 1:0 14:1 1:0 4:-',
  '4:- 16:0 4:-',
  '24:-'
];

export function draw() {
  const canvas = createCanvas(24, 24);
  for (let y = 0; y < ROWS.length; y++) {
    let x = 0;
    for (const segment of ROWS[y].split(' ')) {
      const separator = segment.indexOf(':');
      const width = Number(segment.slice(0, separator));
      const index = segment.slice(separator + 1);
      if (index !== '-') {
        const [color, alpha] = PALETTE[Number(index)];
        rect(canvas, x, y, width, 1, color);
        if (alpha !== 1) {
          canvas.alpha ??= new Array(canvas.w * canvas.h).fill(1);
          canvas.alpha.fill(alpha, y * canvas.w + x, y * canvas.w + x + width);
        }
      }
      x += width;
    }
  }
  return canvas;
}

import { expect, it } from 'vitest';
import { neighbors } from '../src/hex';

it('uses six geometrically matching neighbors for even and odd rows', () => {
  expect(neighbors({ column: 2, row: 2 }, 5, 5)).toEqual([
    { column: 1, row: 2 }, { column: 3, row: 2 },
    { column: 1, row: 1 }, { column: 2, row: 1 },
    { column: 1, row: 3 }, { column: 2, row: 3 },
  ]);
  expect(neighbors({ column: 2, row: 1 }, 5, 5)).toContainEqual({ column: 3, row: 2 });
  expect(neighbors({ column: 2, row: 1 }, 5, 5)).toHaveLength(6);
});

it('keeps corners and edges fixed and adjacency reciprocal at every size', () => {
  expect(neighbors({ column: 0, row: 0 }, 5, 5)).toHaveLength(2);
  expect(neighbors({ column: 4, row: 0 }, 5, 5)).toHaveLength(3);
  expect(neighbors({ column: 0, row: 2 }, 5, 5)).toHaveLength(3);
  for (const [width, height] of [[1, 1], [1, 6], [6, 1], [2, 3], [30, 20]]) {
    for (let row = 0; row < height; row++) for (let column = 0; column < width; column++) {
      const p = { column, row };
      for (const q of neighbors(p, width, height)) {
        expect(q.column).toBeGreaterThanOrEqual(0);
        expect(q.column).toBeLessThan(width);
        expect(q.row).toBeGreaterThanOrEqual(0);
        expect(q.row).toBeLessThan(height);
        expect(neighbors(q, width, height)).toContainEqual(p);
      }
    }
  }
});

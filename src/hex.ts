export interface Position { column: number; row: number }

/** Cell center in units of hex radius; shared by rules-independent animation and rendering. */
export function hexCenter(position: Position): [number, number] {
  return [Math.sqrt(3) * (position.column + 0.5 + (position.row % 2) / 2), 1 + 1.5 * position.row];
}

export const cellIndex = (position: Position, width: number): number => position.row * width + position.column;

/** Pointy-top odd-r offset coordinates: odd rows shift right by half a cell. */
export function neighbors(position: Position, width: number, height: number): Position[] {
  const { column, row } = position;
  const offset = row % 2;
  return [
    { column: column - 1, row }, { column: column + 1, row },
    { column: column - 1 + offset, row: row - 1 }, { column: column + offset, row: row - 1 },
    { column: column - 1 + offset, row: row + 1 }, { column: column + offset, row: row + 1 },
  ].filter(p => p.column >= 0 && p.column < width && p.row >= 0 && p.row < height);
}

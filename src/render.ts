import type { Config } from './config';
import type { Animal, State } from './simulation';
import type { Position } from './hex';

export const colors = { herbivore: '#ffd285', carnivore: '#ff7b87' };
export interface Layout { radius: number; width: number; height: number }
export function layout(config: Config, width: number, maxHeight: number): Layout {
  const unitsWide = Math.sqrt(3) * (config.width + (config.height > 1 ? 0.5 : 0));
  const unitsHigh = 1.5 * (config.height - 1) + 2;
  const radius = Math.min((width - 12) / unitsWide, (maxHeight - 12) / unitsHigh);
  return { radius, width: unitsWide * radius + 12, height: unitsHigh * radius + 12 };
}
export function center(position: Position, radius: number): [number, number] {
  return [6 + Math.sqrt(3) * radius * (position.column + 0.5 + (position.row % 2) / 2),
    6 + radius * (1 + 1.5 * position.row)];
}

/** Three radial arms thicken into wedges; at full energy the wedges form a triangle. */
export function drawAnimal(context: CanvasRenderingContext2D, x: number, y: number, radius: number, energyFraction: number, color: string): void {
  const fraction = Math.max(0, Math.min(1, energyFraction));
  const points = Array.from({ length: 3 }, (_, i) => {
    const angle = -Math.PI / 2 + i * 2 * Math.PI / 3;
    return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius];
  });
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 1.2;
  context.lineJoin = 'round';
  for (let i = 0; i < 3; i++) {
    const tip = points[i];
    const next = points[(i + 1) % 3];
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(tip[0], tip[1]);
    if (fraction > 0.1) {
      // The triangle's edge midpoint bounds each wedge at high energy.
      const fullness = Math.min(1, (fraction - 0.1) / 0.75);
      context.lineTo(x + ((tip[0] + next[0]) / 2 - x) * fullness,
        y + ((tip[1] + next[1]) / 2 - y) * fullness);
      context.closePath();
      context.fill();
      // Fill the other half-arm to the previous edge midpoint as well.
      const previous = points[(i + 2) % 3];
      context.beginPath(); context.moveTo(x, y); context.lineTo(tip[0], tip[1]);
      context.lineTo(x + ((tip[0] + previous[0]) / 2 - x) * fullness,
        y + ((tip[1] + previous[1]) / 2 - y) * fullness);
      context.closePath(); context.fill();
    } else context.stroke();
  }
}

export function render(context: CanvasRenderingContext2D, state: State, config: Config, field: Layout): void {
  const { radius } = field;
  context.clearRect(0, 0, field.width, field.height);
  context.lineWidth = 0.7;
  for (let row = 0; row < config.height; row++) for (let column = 0; column < config.width; column++) {
    const [x, y] = center({ column, row }, radius);
    context.beginPath();
    for (let corner = 0; corner < 6; corner++) {
      const angle = Math.PI / 180 * (60 * corner - 30);
      const px = x + Math.cos(angle) * radius, py = y + Math.sin(angle) * radius;
      if (corner === 0) context.moveTo(px, py); else context.lineTo(px, py);
    }
    context.closePath(); context.strokeStyle = '#35534a'; context.stroke();
    const fraction = state.grass[row * config.width + column] / config.grassMax;
    if (fraction > 0) {
      context.beginPath();
      context.ellipse(x, y, radius * 0.63 * Math.sqrt(fraction), radius * 0.45 * Math.sqrt(fraction), 0, 0, Math.PI * 2);
      context.fillStyle = '#527b3d'; context.fill();
    }
  }
  for (const animal of state.animals) {
    const [x, y] = center(animal, radius);
    drawAnimal(context, x, y, radius * 0.73, animal.energy / config[animal.species].maxEnergy, colors[animal.species]);
  }
}

export function drawLegend(context: CanvasRenderingContext2D, species: Animal['species'], fraction: number): void {
  context.clearRect(0, 0, 48, 48);
  drawAnimal(context, 24, 26, 18, fraction, colors[species]);
}

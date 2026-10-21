import { ticksPerSecond } from './config';
import type { HistorySample, Metric } from './history';
import { createLocalization, type Localization } from './i18n';

export type ChartMode = 'scroll' | 'sweep';
export const timeSpans = [10, 30, 60, 120, 300] as const;
export const metrics: readonly { key: Metric; label: string; unit: 'count' | 'energy'; color: string; dash: number[] }[] = [
  { key: 'carnivoreCount', label: 'history.carnivoreCount', unit: 'count', color: '#ff7b87', dash: [] },
  { key: 'herbivoreCount', label: 'history.herbivoreCount', unit: 'count', color: '#ffd285', dash: [] },
  { key: 'carnivoreEnergy', label: 'history.carnivoreEnergy', unit: 'energy', color: '#ff7b87', dash: [6, 4] },
  { key: 'herbivoreEnergy', label: 'history.herbivoreEnergy', unit: 'energy', color: '#ffd285', dash: [6, 4] },
  { key: 'grassEnergy', label: 'history.grassEnergy', unit: 'energy', color: '#91c76a', dash: [2, 4] },
];
export interface ChartPoint { readonly x: number; readonly sample: HistorySample }
export interface TimeSection { readonly from: number; readonly to: number; readonly start: number; readonly end: number; readonly previous: boolean }
export interface Projection {
  readonly cursor: number;
  readonly segments: readonly (readonly ChartPoint[])[];
  readonly sections: readonly TimeSection[];
}

export function historyPlot(width: number, height: number) {
  return { left: 48, top: 26, width: Math.max(1, width - 96), height: Math.max(1, height - 66) };
}

/** Resolve the time under a fixed horizontal position against the current viewport. */
export function historySampleAt(samples: readonly HistorySample[], mode: ChartMode, seconds: number, x: number): HistorySample | undefined {
  const latest = samples.at(-1);
  if (!latest || x < 0 || x > 1) return;
  const spanTicks = seconds * ticksPerSecond;
  let target = latest.tick - spanTicks + x * spanTicks;
  if (mode === 'sweep') {
    const cycle = Math.floor(latest.tick / spanTicks) * spanTicks;
    if (x <= (latest.tick - cycle) / spanTicks) target = cycle + x * spanTicks;
    else {
      if (cycle === 0) return;
      target = Math.min(cycle - 1, cycle - spanTicks + x * spanTicks);
    }
  }
  if (target < samples[0].tick || target > latest.tick) return;
  const tick = Math.round(target);
  let left = 0, right = samples.length - 1;
  while (left <= right) {
    const middle = (left + right) >>> 1, sample = samples[middle];
    if (sample.tick === tick) return sample;
    if (sample.tick < tick) left = middle + 1; else right = middle - 1;
  }
}

/** Each sweep gets its own path: never join across the cursor or a wrap. */
export function projectHistory(samples: readonly HistorySample[], mode: ChartMode, seconds: number): Projection {
  const now = (samples.at(-1)?.tick ?? 0) / ticksPerSecond;
  if (mode === 'scroll') {
    const start = now - seconds;
    return { cursor: 1,
      segments: [samples.filter(sample => sample.tick / ticksPerSecond >= start)
        .map(sample => ({ x: (sample.tick / ticksPerSecond - start) / seconds, sample }))],
      sections: [{ from: Math.max(0, -start / seconds), to: 1, start: Math.max(0, start), end: now, previous: false }] };
  }
  const cycleStart = Math.floor(now / seconds) * seconds, cursor = (now - cycleStart) / seconds;
  const current: ChartPoint[] = [], previous: ChartPoint[] = [];
  for (const sample of samples) {
    const time = sample.tick / ticksPerSecond;
    if (time >= cycleStart) current.push({ x: (time - cycleStart) / seconds, sample });
    else if (time > now - seconds) previous.push({ x: (time - cycleStart + seconds) / seconds, sample });
  }
  const sections: TimeSection[] = [{ from: 0, to: cursor, start: cycleStart, end: now, previous: false }];
  if (cycleStart > 0) sections.push({ from: cursor, to: 1, start: now - seconds, end: cycleStart, previous: true });
  return { cursor, segments: [previous, current], sections };
}

export function chartScales(projection: Projection, selected: readonly Metric[]): { count?: number; energy?: number } {
  const scales: { count?: number; energy?: number } = {};
  for (const metric of metrics.filter(metric => selected.includes(metric.key))) {
    let maximum = scales[metric.unit] ?? 1;
    for (const segment of projection.segments) for (const point of segment) maximum = Math.max(maximum, point.sample[metric.key]);
    scales[metric.unit] = maximum;
  }
  return scales;
}

/** Keep endpoints and extrema in time order within each pixel, separately per path. */
export function compactPoints(points: readonly ChartPoint[], metric: Metric, width: number): readonly ChartPoint[] {
  const compact: ChartPoint[] = [];
  let start = 0;
  while (start < points.length) {
    const column = Math.floor(points[start].x * width);
    let end = start + 1, min = start, max = start;
    while (end < points.length && Math.floor(points[end].x * width) === column) {
      if (points[end].sample[metric] < points[min].sample[metric]) min = end;
      if (points[end].sample[metric] > points[max].sample[metric]) max = end;
      end++;
    }
    for (const index of [...new Set([start, min, max, end - 1])].sort((a, b) => a - b)) compact.push(points[index]);
    start = end;
  }
  return compact;
}

const defaultLocalization = createLocalization();

export function drawHistory(context: CanvasRenderingContext2D, width: number, height: number,
  samples: readonly HistorySample[], mode: ChartMode, seconds: number, selected: readonly Metric[], i18n: Localization = defaultLocalization): void {
  const numberLabel = (value: number) => i18n.number(value, { maximumFractionDigits: 1, notation: 'compact' });
  const timeLabel = (value: number) => i18n.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  context.clearRect(0, 0, width, height);
  context.direction = 'ltr';
  const projection = projectHistory(samples, mode, seconds), scales = chartScales(projection, selected);
  const { left, top, width: plotWidth, height: plotHeight } = historyPlot(width, height);
  const bottom = top + plotHeight;
  context.font = '11px system-ui, sans-serif'; context.lineWidth = 1; context.setLineDash([]);
  for (let i = 0; i <= 4; i++) {
    const y = bottom - plotHeight * i / 4;
    context.strokeStyle = '#30483a'; context.beginPath(); context.moveTo(left, y); context.lineTo(left + plotWidth, y); context.stroke();
    context.fillStyle = '#bdcdb8';
    if (scales.count !== undefined) {
      context.textAlign = 'right'; context.fillText(numberLabel(scales.count * i / 4), left - 7, y + 4, 38);
    }
    if (scales.energy !== undefined) {
      context.textAlign = 'left'; context.fillText(numberLabel(scales.energy * i / 4), left + plotWidth + 7, y + 4, 38);
    }
  }
  context.direction = i18n.direction;
  context.fillStyle = '#bdcdb8'; context.textAlign = 'left';
  if (scales.count !== undefined) context.fillText(i18n.t('history.count'), left, 13);
  context.textAlign = 'right';
  if (scales.energy !== undefined) context.fillText(i18n.t('history.energy'), left + plotWidth, 13);
  // Right alignment anchors the decimal position even when the integer gains a digit.
  context.font = '11px ui-monospace, Consolas, monospace';
  context.direction = 'ltr';
  for (let i = 0; i <= 4; i++) {
    const x = i / 4;
    // Current section wins at the cursor; the right-hand section belongs to the previous sweep.
    const section = projection.sections.find(section => x >= section.from && x <= section.to);
    if (!section) continue;
    const fraction = section.to === section.from ? 0 : (x - section.from) / (section.to - section.from);
    const time = section.start + fraction * (section.end - section.start);
    context.fillStyle = section.previous ? '#9cb29c' : '#e8f1df'; context.textAlign = 'right';
    context.fillText(timeLabel(time), left + x * plotWidth, bottom + 17, Math.max(24, plotWidth / 4));
  }
  context.font = '11px system-ui, sans-serif';
  context.direction = i18n.direction;
  context.fillStyle = '#9cb29c'; context.textAlign = 'center';
  context.fillText(i18n.t('history.axisTime'), left + plotWidth / 2, height - 3);
  context.save(); context.beginPath(); context.rect(left - 2, top - 2, plotWidth + 4, plotHeight + 4); context.clip();
  for (const metric of metrics.filter(metric => selected.includes(metric.key))) {
    const maximum = scales[metric.unit]!;
    context.strokeStyle = context.fillStyle = metric.color; context.lineWidth = 1.8; context.setLineDash(metric.dash);
    for (const [index, segment] of projection.segments.entries()) {
      const points = compactPoints(segment, metric.key, plotWidth);
      context.globalAlpha = mode === 'sweep' && index === 0 ? 0.55 : 1;
      context.beginPath();
      for (const [i, point] of points.entries()) {
        const x = left + point.x * plotWidth, y = bottom - point.sample[metric.key] / maximum * plotHeight;
        if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.stroke();
      if (points.length === 1) {
        context.beginPath(); context.arc(left + points[0].x * plotWidth,
          bottom - points[0].sample[metric.key] / maximum * plotHeight, 2, 0, 2 * Math.PI); context.fill();
      }
    }
  }
  context.restore(); context.setLineDash([3, 3]); context.strokeStyle = '#e8f1df'; context.lineWidth = 1;
  const cursorX = left + projection.cursor * plotWidth;
  context.beginPath(); context.moveTo(cursorX, top); context.lineTo(cursorX, bottom); context.stroke(); context.setLineDash([]);
}

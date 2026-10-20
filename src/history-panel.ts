import { ticksPerSecond } from './config';
import { type History, type HistorySample, type Metric } from './history';
import { drawHistory, metrics, timeSpans, type ChartMode } from './history-chart';

/** Owns chart choices and rendering; recording is independent of the panel. */
export function createHistoryPanel(history: History, signal: AbortSignal) {
  const panel = document.querySelector<HTMLDetailsElement>('#history')!;
  const mode = document.querySelector<HTMLSelectElement>('#history-mode')!;
  const span = document.querySelector<HTMLSelectElement>('#history-span')!;
  const canvas = document.querySelector<HTMLCanvasElement>('#history-canvas')!;
  const host = canvas.parentElement!;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Dieser Browser unterstützt Canvas 2D nicht.');
  const fields = document.querySelector('#history-metrics')!;
  const values = document.querySelector('#history-values')!;
  const empty = document.querySelector<HTMLElement>('#history-empty')!;
  const sweep = document.querySelector<HTMLElement>('#history-sweep')!;
  const time = document.querySelector('#history-time')!;
  const range = document.querySelector('#history-range')!;
  const inputs = new Map<Metric, HTMLInputElement>();
  const outputs = new Map<Metric, { group: HTMLElement; output: HTMLElement }>();
  const format = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });
  let lastSample: HistorySample | undefined;
  fields.replaceChildren(); values.replaceChildren(); span.replaceChildren();
  for (const seconds of timeSpans) span.add(new Option(`${seconds} s`, String(seconds)));
  span.value = '60';
  for (const metric of metrics) {
    const label = document.createElement('label'), input = document.createElement('input');
    input.type = 'checkbox'; input.value = metric.key; input.checked = metric.unit === 'count';
    const line = document.createElement('span'); line.className = 'history-line';
    line.style.borderColor = metric.color; line.style.borderTopStyle = metric.dash.length ? 'dashed' : 'solid';
    line.setAttribute('aria-hidden', 'true');
    label.append(input, line, metric.label); fields.append(label); inputs.set(metric.key, input);
    const group = document.createElement('div'), term = document.createElement('dt'), output = document.createElement('dd');
    term.textContent = metric.label; group.append(term, output); values.append(group);
    outputs.set(metric.key, { group, output });
  }
  const refresh = (force = false) => {
    if (!panel.open || signal.aborted) return;
    const latest = history.latest;
    if (!latest || (!force && latest === lastSample)) return;
    const width = host.clientWidth, height = host.clientHeight;
    if (width < 100 || height < 80) return;
    const samples = history.values();
    const selected = [...inputs].filter(([, input]) => input.checked).map(([metric]) => metric);
    for (const [metric, { group, output }] of outputs) {
      group.hidden = !selected.includes(metric);
      output.textContent = format.format(latest[metric]);
    }
    empty.hidden = selected.length > 0;
    sweep.hidden = mode.value !== 'sweep';
    time.textContent = `Tick ${latest.tick} · ${format.format(latest.tick / ticksPerSecond)} s`;
    range.textContent = `Aufgezeichneter Verlauf: ${format.format(samples[0].tick / ticksPerSecond)}–${format.format(latest.tick / ticksPerSecond)} s (max. 300 s)`;
    const ratio = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(width * ratio)) canvas.width = Math.round(width * ratio);
    if (canvas.height !== Math.round(height * ratio)) canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawHistory(context, width, height, samples, mode.value as ChartMode, Number(span.value), selected);
    lastSample = latest;
  };
  const redraw = () => refresh(true);
  panel.addEventListener('toggle', redraw, { signal });
  panel.addEventListener('change', redraw, { signal });
  window.addEventListener('resize', redraw, { signal });
  const observer = new ResizeObserver(redraw); observer.observe(host);
  signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  return { refresh };
}

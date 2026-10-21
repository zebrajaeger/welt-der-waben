import { ticksPerSecond } from './config';
import { type History, type HistorySample, type Metric } from './history';
import { drawHistory, historyPlot, historySampleAt, metrics, timeSpans, type ChartMode } from './history-chart';
import { formatHistoryNumber, metricCharacters, timeCharacters, type HistoryNumberKind } from './history-format';

function createNumber(element: HTMLElement, kind: HistoryNumberKind, capacity: number, unit: string) {
  const visible = document.createElement('span'), full = document.createElement('span');
  visible.className = 'history-number-text'; full.className = 'history-number-full';
  element.classList.add('history-number'); element.replaceChildren(visible, full);
  return (value: number) => {
    const formatted = formatHistoryNumber(value, kind, capacity), shortened = formatted.text !== formatted.full;
    visible.textContent = formatted.text;
    visible.setAttribute('aria-hidden', String(shortened));
    full.hidden = !shortened; full.textContent = `${formatted.full} ${unit}`;
    element.title = `${formatted.full} ${unit}`;
  };
}

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
  const tooltip = document.createElement('div');
  tooltip.id = 'history-tooltip'; tooltip.className = 'history-tooltip'; tooltip.hidden = true;
  tooltip.setAttribute('role', 'tooltip');
  const tooltipTime = document.createElement('div'), tooltipTick = document.createElement('span');
  const tooltipSeconds = document.createElement('span'), tooltipValues = document.createElement('dl');
  tooltipValues.id = 'history-tooltip-values';
  tooltipTime.append('Zeit ', tooltipSeconds, ' s · Tick ', tooltipTick);
  tooltip.append(tooltipTime, tooltipValues); document.body.append(tooltip);
  const setTooltipTime = createNumber(tooltipSeconds, 'decimal', timeCharacters, 'Sekunden');
  const setTooltipTick = createNumber(tooltipTick, 'integer', timeCharacters, 'Ticks');
  tooltipSeconds.classList.add('history-number--time'); tooltipTick.classList.add('history-number--time');
  tooltipSeconds.id = 'history-tooltip-seconds'; tooltipTick.id = 'history-tooltip-tick';
  const empty = document.querySelector<HTMLElement>('#history-empty')!;
  const sweep = document.querySelector<HTMLElement>('#history-sweep')!;
  const setTick = createNumber(document.querySelector<HTMLElement>('#history-tick')!, 'integer', timeCharacters, 'Ticks');
  const setSeconds = createNumber(document.querySelector<HTMLElement>('#history-seconds')!, 'decimal', timeCharacters, 'Sekunden');
  const setStart = createNumber(document.querySelector<HTMLElement>('#history-range-start')!, 'decimal', timeCharacters, 'Sekunden');
  const setEnd = createNumber(document.querySelector<HTMLElement>('#history-range-end')!, 'decimal', timeCharacters, 'Sekunden');
  const inputs = new Map<Metric, HTMLInputElement>();
  const outputs = new Map<Metric, (value: number) => void>();
  let lastSample: HistorySample | undefined;
  let samples: readonly HistorySample[] = [];
  let pointer: { x: number; y: number } | undefined;
  let keyboardX: number | undefined;
  fields.replaceChildren(); span.replaceChildren();
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
    term.textContent = metric.unit === 'energy' ? `Σ ${metric.label}` : metric.label;
    group.append(term, output); tooltipValues.append(group);
    output.dataset.metric = metric.key;
    outputs.set(metric.key, createNumber(output, metric.unit === 'count' ? 'integer' : 'decimal',
      metricCharacters, metric.unit === 'count' ? metric.label.replace('Anzahl ', '') : 'Energie'));
  }
  const hideTooltip = () => { pointer = undefined; keyboardX = undefined; tooltip.hidden = true; };
  const updateTooltip = () => {
    tooltip.hidden = true;
    if (!panel.open || signal.aborted || (!pointer && keyboardX === undefined)) return;
    const box = canvas.getBoundingClientRect(), plot = historyPlot(box.width, box.height);
    const point = pointer ?? { x: box.left + plot.left + keyboardX! * plot.width, y: box.top + plot.top + plot.height / 2 };
    const x = (point.x - box.left - plot.left) / plot.width;
    if (point.y < box.top + plot.top || point.y > box.top + plot.top + plot.height) return;
    if (pointer && document.elementFromPoint(point.x, point.y) !== canvas) return;
    const sample = historySampleAt(samples, mode.value as ChartMode, Number(span.value), x);
    if (!sample) return;
    for (const [metric, setValue] of outputs) setValue(sample[metric]);
    setTooltipTime(sample.tick / ticksPerSecond); setTooltipTick(sample.tick);
    tooltip.hidden = false;
    const width = tooltip.offsetWidth, height = tooltip.offsetHeight;
    const left = point.x + 14 + width <= innerWidth - 8 ? point.x + 14 : point.x - width - 14;
    const top = point.y + 14 + height <= innerHeight - 8 ? point.y + 14 : point.y - height - 14;
    tooltip.style.left = `${Math.max(8, Math.min(left, innerWidth - width - 8))}px`;
    tooltip.style.top = `${Math.max(8, Math.min(top, innerHeight - height - 8))}px`;
  };
  const refresh = (force = false) => {
    if (!panel.open || signal.aborted) { tooltip.hidden = true; return; }
    const latest = history.latest;
    if (!latest || (!force && latest === lastSample)) return;
    const width = host.clientWidth, height = host.clientHeight;
    if (width < 100 || height < 80) return;
    samples = history.values();
    const selected = [...inputs].filter(([, input]) => input.checked).map(([metric]) => metric);
    empty.hidden = selected.length > 0;
    sweep.hidden = mode.value !== 'sweep';
    setTick(latest.tick); setSeconds(latest.tick / ticksPerSecond);
    setStart(samples[0].tick / ticksPerSecond); setEnd(latest.tick / ticksPerSecond);
    const ratio = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(width * ratio)) canvas.width = Math.round(width * ratio);
    if (canvas.height !== Math.round(height * ratio)) canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawHistory(context, width, height, samples, mode.value as ChartMode, Number(span.value), selected);
    updateTooltip();
    lastSample = latest;
  };
  const redraw = () => refresh(true);
  panel.addEventListener('toggle', redraw, { signal });
  panel.addEventListener('change', redraw, { signal });
  window.addEventListener('resize', redraw, { signal });
  window.addEventListener('scroll', redraw, { signal, capture: true });
  window.addEventListener('blur', hideTooltip, { signal });
  canvas.addEventListener('pointermove', event => {
    pointer = { x: event.clientX, y: event.clientY }; keyboardX = undefined; updateTooltip();
  }, { signal });
  canvas.addEventListener('pointerleave', hideTooltip, { signal });
  canvas.addEventListener('focus', () => {
    if (pointer) return;
    const latest = history.latest;
    keyboardX = mode.value === 'scroll' ? 1 : ((latest?.tick ?? 0) % (Number(span.value) * ticksPerSecond)) / (Number(span.value) * ticksPerSecond);
    updateTooltip();
  }, { signal });
  canvas.addEventListener('blur', hideTooltip, { signal });
  canvas.addEventListener('keydown', event => {
    if (event.key === 'Escape') { hideTooltip(); return; }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); pointer = undefined;
    const delta = 1 / (Number(span.value) * ticksPerSecond);
    keyboardX = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : Math.max(0, Math.min(1, (keyboardX ?? 1) + (event.key === 'ArrowLeft' ? -delta : delta)));
    updateTooltip();
  }, { signal });
  const observer = new ResizeObserver(redraw); observer.observe(host);
  signal.addEventListener('abort', () => { observer.disconnect(); tooltip.remove(); }, { once: true });
  return { refresh };
}

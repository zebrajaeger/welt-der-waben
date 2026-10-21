import { ticksPerSecond } from './config';
import { type History, type HistorySample, type Metric } from './history';
import { drawHistory, historyPlot, historySampleAt, metrics, timeSpans, type ChartMode } from './history-chart';
import { formatHistoryNumber, metricCharacters, timeCharacters, type HistoryNumberKind } from './history-format';
import { createLocalization, type Localization } from './i18n';
import { ApplicationError } from './errors';

function createNumber(element: HTMLElement, kind: HistoryNumberKind, capacity: number, unitKey: string, i18n: Localization) {
  const visible = document.createElement('span'), full = document.createElement('span');
  visible.className = 'history-number-text'; full.className = 'history-number-full';
  element.classList.add('history-number'); element.replaceChildren(visible, full);
  element.dir = 'ltr';
  return (value: number) => {
    const formatted = formatHistoryNumber(value, kind, capacity, i18n.locale), shortened = formatted.text !== formatted.full;
    const unit = i18n.t(unitKey);
    visible.textContent = formatted.text;
    visible.setAttribute('aria-hidden', String(shortened));
    full.hidden = !shortened; full.textContent = `${formatted.full} ${unit}`;
    element.title = `${formatted.full} ${unit}`;
  };
}

/** Owns chart choices and rendering; recording is independent of the panel. */
export function createHistoryPanel(history: History, signal: AbortSignal, i18n: Localization = createLocalization()) {
  const panel = document.querySelector<HTMLDetailsElement>('#history')!;
  const mode = document.querySelector<HTMLSelectElement>('#history-mode')!;
  const span = document.querySelector<HTMLSelectElement>('#history-span')!;
  const canvas = document.querySelector<HTMLCanvasElement>('#history-canvas')!;
  const host = canvas.parentElement!;
  const context = canvas.getContext('2d');
  if (!context) throw new ApplicationError('canvas');
  const fields = document.querySelector('#history-metrics')!;
  const tooltip = document.createElement('div');
  tooltip.id = 'history-tooltip'; tooltip.className = 'history-tooltip'; tooltip.hidden = true;
  tooltip.setAttribute('role', 'tooltip');
  const tooltipTime = document.createElement('div'), tooltipTick = document.createElement('span');
  const tooltipSeconds = document.createElement('span'), tooltipValues = document.createElement('dl');
  tooltipValues.id = 'history-tooltip-values';
  const translateTooltipTime = () => {
    tooltipTime.replaceChildren();
    const positionText = i18n.t('tooltip.position', { seconds: '\u0000seconds\u0000', tick: '\u0000tick\u0000' });
    for (const part of positionText.split(/(\u0000(?:seconds|tick)\u0000)/)) {
      tooltipTime.append(part === '\u0000seconds\u0000' ? tooltipSeconds : part === '\u0000tick\u0000' ? tooltipTick : part);
    }
  };
  translateTooltipTime();
  tooltip.append(tooltipTime, tooltipValues); document.body.append(tooltip);
  const setTooltipTime = createNumber(tooltipSeconds, 'decimal', timeCharacters, 'units.seconds', i18n);
  const setTooltipTick = createNumber(tooltipTick, 'integer', timeCharacters, 'units.ticks', i18n);
  tooltipSeconds.classList.add('history-number--time'); tooltipTick.classList.add('history-number--time');
  tooltipSeconds.id = 'history-tooltip-seconds'; tooltipTick.id = 'history-tooltip-tick';
  const empty = document.querySelector<HTMLElement>('#history-empty')!;
  const sweep = document.querySelector<HTMLElement>('#history-sweep')!;
  const setTick = createNumber(document.querySelector<HTMLElement>('#history-tick')!, 'integer', timeCharacters, 'units.ticks', i18n);
  const setSeconds = createNumber(document.querySelector<HTMLElement>('#history-seconds')!, 'decimal', timeCharacters, 'units.seconds', i18n);
  const setStart = createNumber(document.querySelector<HTMLElement>('#history-range-start')!, 'decimal', timeCharacters, 'units.seconds', i18n);
  const setEnd = createNumber(document.querySelector<HTMLElement>('#history-range-end')!, 'decimal', timeCharacters, 'units.seconds', i18n);
  const inputs = new Map<Metric, HTMLInputElement>();
  const outputs = new Map<Metric, (value: number) => void>();
  let lastSample: HistorySample | undefined;
  let samples: readonly HistorySample[] = [];
  let pointer: { x: number; y: number } | undefined;
  let keyboardX: number | undefined;
  fields.replaceChildren(); span.replaceChildren();
  for (const seconds of timeSpans) span.add(new Option(`${i18n.number(seconds)} ${i18n.t('units.shortSeconds')}`, String(seconds)));
  span.value = '60';
  for (const metric of metrics) {
    const label = document.createElement('label'), input = document.createElement('input');
    input.type = 'checkbox'; input.value = metric.key; input.checked = metric.unit === 'count';
    const line = document.createElement('span'); line.className = 'history-line';
    line.style.borderColor = metric.color; line.style.borderTopStyle = metric.dash.length ? 'dashed' : 'solid';
    line.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span'); name.dataset.i18n = metric.label; name.textContent = i18n.t(metric.label);
    label.append(input, line, name); fields.append(label); inputs.set(metric.key, input);
    const group = document.createElement('div'), term = document.createElement('dt'), output = document.createElement('dd');
    term.dataset.i18n = `tooltip.${metric.key}`; term.textContent = i18n.t(term.dataset.i18n);
    group.append(term, output); tooltipValues.append(group);
    output.dataset.metric = metric.key;
    outputs.set(metric.key, createNumber(output, metric.unit === 'count' ? 'integer' : 'decimal',
      metricCharacters, metric.label, i18n));
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
    drawHistory(context, width, height, samples, mode.value as ChartMode, Number(span.value), selected, i18n);
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
  return { refresh, localize() {
    translateTooltipTime();
    for (const option of span.options) option.textContent = `${i18n.number(Number(option.value))} ${i18n.t('units.shortSeconds')}`;
    refresh(true);
  } };
}

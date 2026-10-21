import './style.css';
import { ticksPerSecond } from './config';
import { copyConfig } from './settings';
import { loadSettings } from './settings-storage';
import { createSettingsPanel } from './settings-panel';
import { initialize, type State } from './simulation';
import { drawLegend, layout, render } from './render';
import { Playback } from './playback';
import { History } from './history';
import { createHistoryPanel } from './history-panel';
import { translateDocument } from './i18n';
import { preferredLocalization } from './language-storage';
import { createLanguageControl } from './language-control';
import { ApplicationError } from './errors';
import { errorMessage } from './error-message';

const i18n = preferredLocalization(navigator.languages, navigator.language);
translateDocument(document, i18n);

const status = document.querySelector<HTMLElement>('#status')!;
const canvas = document.querySelector<HTMLCanvasElement>('#field')!;
const context = canvas.getContext('2d');
const toggle = document.querySelector<HTMLButtonElement>('#toggle')!;
const singleStep = document.querySelector<HTMLButtonElement>('#step')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;
const speed = document.querySelector<HTMLSelectElement>('#speed')!;

try {
  const loaded = loadSettings();
  let activeConfig = copyConfig(loaded.config);
  if (!context) throw new ApplicationError('canvas');
  const history = new History();
  const initial = initialize(activeConfig);
  history.reset(initial);
  const record = (state: State) => history.record(state);
  let playback = new Playback(initial, activeConfig, undefined, undefined, record);
  const updateSpeed = () => {
    speed.replaceChildren();
    for (const value of [...new Set([0.25, 0.5, 1, 2, 4, 8, playback.speedMultiplier])].sort((a, b) => a - b)) {
      speed.add(new Option(`${i18n.number(value, { maximumSignificantDigits: 15 })}×`, String(value)));
    }
    speed.value = String(playback.speedMultiplier);
  };
  updateSpeed();
  const listeners = new AbortController();
  const historyPanel = createHistoryPanel(history, listeners.signal, i18n);
  let frameRequest: number | undefined;

  const draw = () => {
    const host = canvas.parentElement!;
    // The host gets its size from the page, independently of the canvas bitmap.
    if (host.clientWidth > 12 && host.clientHeight > 12) {
      const field = layout(activeConfig, host.clientWidth, host.clientHeight);
      const ratio = window.devicePixelRatio || 1;
      const width = Math.round(field.width * ratio), height = Math.round(field.height * ratio);
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      canvas.style.width = `${field.width}px`;
      canvas.style.height = `${field.height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const frame = playback.frame;
      render(context, frame.state, activeConfig, field, frame.shapes);
    }
    const state = playback.state;
    const herbivores = state.animals.filter(a => a.species === 'herbivore').length;
    const label = i18n.t('world.status', { tick: i18n.number(state.tick, { useGrouping: false }),
      seconds: i18n.number(state.tick / ticksPerSecond, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      herbivores: i18n.number(herbivores), carnivores: i18n.number(state.animals.length - herbivores) });
    if (status.textContent !== label) status.textContent = label;
    toggle.textContent = i18n.t(playback.running ? 'controls.pause' : 'controls.resume');
    toggle.setAttribute('aria-pressed', String(playback.running));
    singleStep.disabled = !playback.canSingleStep;
    historyPanel.refresh();
  };
  const animate = (now: number) => {
    frameRequest = undefined;
    playback.tick(now);
    draw();
    schedule();
  };
  const schedule = () => {
    if (frameRequest !== undefined) cancelAnimationFrame(frameRequest);
    frameRequest = playback.running ? requestAnimationFrame(animate) : undefined;
  };
  const settings = createSettingsPanel(loaded, () => activeConfig, config => {
    const now = performance.now(), running = playback.running;
    const nextConfig = copyConfig(config);
    const nextInitial = initialize(nextConfig);
    const nextPlayback = new Playback(nextInitial, nextConfig, undefined, undefined, record);
    if (!running) nextPlayback.toggle(now);
    else nextPlayback.tick(now);
    activeConfig = nextConfig; playback = nextPlayback;
    history.reset(nextInitial);
    updateSpeed(); draw(); schedule();
  }, listeners.signal, i18n);
  createLanguageControl(i18n, () => {
    translateDocument(document, i18n);
    settings.localize(); historyPanel.localize(); updateSpeed(); draw();
  }, listeners.signal);
  toggle.addEventListener('click', () => { playback.toggle(performance.now()); draw(); schedule(); }, { signal: listeners.signal });
  singleStep.addEventListener('click', () => { playback.singleStep(performance.now()); draw(); schedule(); }, { signal: listeners.signal });
  reset.addEventListener('click', () => {
    const state = initialize(activeConfig);
    playback.reset(state, performance.now()); history.reset(state); draw(); schedule();
  }, { signal: listeners.signal });
  speed.addEventListener('change', () => {
    playback.setSpeedMultiplier(Number(speed.value), performance.now());
    activeConfig = { ...activeConfig, speedMultiplier: playback.speedMultiplier };
    settings.setTempo(playback.speedMultiplier);
    draw(); schedule();
  }, { signal: listeners.signal });
  const observer = new ResizeObserver(draw);
  observer.observe(canvas.parentElement!);
  window.addEventListener('resize', draw, { signal: listeners.signal });
  for (const symbol of document.querySelectorAll<HTMLCanvasElement>('[data-energy]')) {
    const ctx = symbol.getContext('2d');
    if (ctx) drawLegend(ctx, symbol.dataset.species === 'carnivore' ? 'carnivore' : 'herbivore', Number(symbol.dataset.energy));
  }
  draw(); schedule();
  import.meta.hot?.dispose(() => {
    if (frameRequest !== undefined) cancelAnimationFrame(frameRequest);
    observer.disconnect(); listeners.abort();
  });
} catch (error) {
  status.textContent = errorMessage(error, i18n);
  status.setAttribute('role', 'alert');
  toggle.disabled = singleStep.disabled = reset.disabled = speed.disabled = true;
}

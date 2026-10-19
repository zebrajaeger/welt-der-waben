import './style.css';
import { defaultConfig, validateConfig } from './config';
import { initialize } from './simulation';
import { drawLegend, layout, render } from './render';
import { Playback } from './playback';

const status = document.querySelector<HTMLElement>('#status')!;
const canvas = document.querySelector<HTMLCanvasElement>('#field')!;
const context = canvas.getContext('2d');
const toggle = document.querySelector<HTMLButtonElement>('#toggle')!;
const singleStep = document.querySelector<HTMLButtonElement>('#step')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;
const speed = document.querySelector<HTMLSelectElement>('#speed')!;

try {
  validateConfig(defaultConfig);
  if (!context) throw new Error('Dieser Browser unterstützt Canvas 2D nicht.');
  const playback = new Playback(initialize(defaultConfig), defaultConfig);
  const speedFormat = new Intl.NumberFormat('de-DE', { maximumSignificantDigits: 15 });
  for (const value of [...new Set([0.25, 0.5, 1, 2, 4, 8, playback.stepsPerSecond])].sort((a, b) => a - b)) {
    speed.add(new Option(`${speedFormat.format(value)} ${value === 1 ? 'Schritt' : 'Schritte'}/s`, String(value)));
  }
  speed.value = String(playback.stepsPerSecond);
  const listeners = new AbortController();
  let frameRequest: number | undefined;

  const draw = () => {
    const field = layout(defaultConfig, Math.max(160, canvas.parentElement!.clientWidth), Math.max(220, window.innerHeight - 270));
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(field.width * ratio), height = Math.round(field.height * ratio);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    canvas.style.width = `${field.width}px`;
    canvas.style.height = `${field.height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const frame = playback.frame;
    render(context, frame.state, defaultConfig, field, frame.shapes);
    const state = playback.state;
    const herbivores = state.animals.filter(a => a.species === 'herbivore').length;
    const label = `Schritt ${state.step} · ${herbivores} Grasfresser · ${state.animals.length - herbivores} Karnivoren`;
    if (status.textContent !== label) status.textContent = label;
    toggle.textContent = playback.running ? 'Pause' : 'Weiter';
    toggle.setAttribute('aria-pressed', String(playback.running));
    singleStep.disabled = !playback.canSingleStep;
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
  toggle.addEventListener('click', () => { playback.toggle(performance.now()); draw(); schedule(); }, { signal: listeners.signal });
  singleStep.addEventListener('click', () => { playback.singleStep(performance.now()); draw(); schedule(); }, { signal: listeners.signal });
  reset.addEventListener('click', () => { playback.reset(initialize(defaultConfig), performance.now()); draw(); schedule(); }, { signal: listeners.signal });
  speed.addEventListener('change', () => {
    playback.setStepsPerSecond(Number(speed.value), performance.now());
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
  status.textContent = error instanceof Error ? error.message : String(error);
  status.setAttribute('role', 'alert');
  toggle.disabled = singleStep.disabled = reset.disabled = speed.disabled = true;
}

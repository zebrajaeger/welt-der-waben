import './style.css';
import { defaultConfig, validateConfig } from './config';
import { initialize, step } from './simulation';
import { drawLegend, layout, render } from './render';

const status = document.querySelector<HTMLElement>('#status')!;
const canvas = document.querySelector<HTMLCanvasElement>('#field')!;
const context = canvas.getContext('2d');
const toggle = document.querySelector<HTMLButtonElement>('#toggle')!;
const singleStep = document.querySelector<HTMLButtonElement>('#step')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;

try {
  validateConfig(defaultConfig);
  if (!context) throw new Error('Dieser Browser unterstützt Canvas 2D nicht.');
  let state = initialize(defaultConfig);
  let playing = true;
  let timer: ReturnType<typeof setInterval>;

  const draw = () => {
    const field = layout(defaultConfig, Math.max(160, canvas.parentElement!.clientWidth), Math.max(220, window.innerHeight - 270));
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(field.width * ratio);
    canvas.height = Math.round(field.height * ratio);
    canvas.style.width = `${field.width}px`;
    canvas.style.height = `${field.height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    render(context, state, defaultConfig, field);
    const herbivores = state.animals.filter(a => a.species === 'herbivore').length;
    status.textContent = `Schritt ${state.step} · ${herbivores} Grasfresser · ${state.animals.length - herbivores} Karnivoren`;
  };
  const advance = () => { state = step(state, defaultConfig); draw(); };
  const schedule = () => {
    clearInterval(timer);
    if (playing) timer = setInterval(advance, 1000 / defaultConfig.stepsPerSecond);
    toggle.textContent = playing ? 'Pause' : 'Weiter';
    toggle.setAttribute('aria-pressed', String(playing));
    singleStep.disabled = playing;
  };
  toggle.addEventListener('click', () => { playing = !playing; schedule(); });
  singleStep.addEventListener('click', advance);
  reset.addEventListener('click', () => { state = initialize(defaultConfig); draw(); });
  const observer = new ResizeObserver(draw);
  observer.observe(canvas.parentElement!);
  window.addEventListener('resize', draw);
  for (const symbol of document.querySelectorAll<HTMLCanvasElement>('[data-energy]')) {
    const ctx = symbol.getContext('2d');
    if (ctx) drawLegend(ctx, symbol.dataset.species === 'carnivore' ? 'carnivore' : 'herbivore', Number(symbol.dataset.energy));
  }
  draw(); schedule();
  import.meta.hot?.dispose(() => { clearInterval(timer); observer.disconnect(); window.removeEventListener('resize', draw); });
} catch (error) {
  status.textContent = error instanceof Error ? error.message : String(error);
  status.setAttribute('role', 'alert');
  toggle.disabled = singleStep.disabled = reset.disabled = true;
}

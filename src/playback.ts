import type { Config } from './config';
import { planAnimation, restFrame, sampleAnimation, type AnimationFrame, type AnimationPlan } from './animation';
import { transition, type Random, type State, type Transition } from './simulation';

type Mode = 'continuous' | 'single' | 'paused';

/** Owns one logical transition and its active elapsed time. The browser supplies timestamps. */
export class Playback {
  private current: State;
  private plan?: AnimationPlan;
  private angles: ReadonlyMap<number, number> = new Map();
  private mode: Mode = 'continuous';
  private resumeMode: Mode = 'continuous';
  private lastTime?: number;
  private fraction = 0;
  private rate: number;
  private readonly compute: (state: State) => Transition;

  constructor(state: State, config: Config, random: Random = Math.random,
    compute?: (state: State) => Transition) {
    this.current = state;
    this.rate = config.stepsPerSecond;
    this.compute = compute ?? (state => transition(state, config, random));
  }
  get state(): State { return this.current; }
  get running(): boolean { return this.mode !== 'paused'; }
  get active(): boolean { return this.plan !== undefined; }
  get canSingleStep(): boolean { return !this.running && !this.active; }
  get stepsPerSecond(): number { return this.rate; }
  get progress(): number { return this.active ? Math.min(1, this.fraction) : 0; }
  get frame(): AnimationFrame { return this.plan ? sampleAnimation(this.plan, this.progress) : restFrame(this.current, this.angles); }

  private begin(): void {
    this.plan = planAnimation(this.compute(this.current), this.angles);
    this.fraction = 0;
  }
  tick(now: number): void {
    const delta = this.lastTime === undefined ? 0 : Math.max(0, now - this.lastTime);
    this.lastTime = now;
    if (!this.running) return;
    if (!this.plan) this.begin();
    this.fraction += delta * this.rate / 1000;
    if (this.fraction < 1 - Number.EPSILON * 8) return;
    this.current = this.plan!.transition.after;
    this.angles = this.plan!.endAngles;
    this.plan = undefined;
    this.fraction = 0;
    if (this.mode === 'single') this.mode = 'paused';
    // A delayed frame closes at most this transition. No unbounded catch-up queue.
  }
  /** Settle elapsed time at the old rate first; changing tempo never starts a transition. */
  setStepsPerSecond(value: number, now: number): void {
    if (!Number.isFinite(value) || value <= 0) throw new Error('Tempo muss eine endliche Zahl > 0 sein');
    if (this.plan && this.running) this.tick(now);
    this.rate = value;
    this.lastTime = now;
  }
  toggle(now: number): void {
    if (this.running) {
      const previousMode = this.mode;
      this.tick(now);
      this.resumeMode = this.plan ? previousMode : 'continuous';
      this.mode = 'paused';
    } else {
      this.mode = this.plan ? this.resumeMode : 'continuous';
    }
    this.lastTime = now;
  }
  singleStep(now: number): boolean {
    if (!this.canSingleStep) return false;
    this.mode = 'single';
    this.lastTime = now;
    this.begin();
    return true;
  }
  reset(state: State, now: number): void {
    this.current = state;
    this.plan = undefined;
    this.angles = new Map();
    this.fraction = 0;
    this.lastTime = now;
    this.mode = this.mode === 'continuous' ? 'continuous' : 'paused';
    this.resumeMode = 'continuous';
  }
}

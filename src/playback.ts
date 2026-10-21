import { ApplicationError } from './errors';
﻿import type { Config } from './config';
import { ticksPerSecond } from './config';
import { sampleAnimation, type AnimationFrame } from './animation';
import { tick, type Random, type State } from './simulation';

export const maxTicksPerFrame = 30;
export const maxPendingTicks = 120;
export const maxFrameDeltaMs = 250;
/** The browser owns real time; the model sees only individual fixed ticks. */
export class Playback {
  private current: State;
  private paused = false;
  private lastTime?: number;
  private accumulator = 0;
  private multiplier: number;
  constructor(state: State, private readonly config: Config, private readonly random: Random = Math.random,
    private readonly compute: (state: State) => State = state => tick(state, config, random),
    private readonly onTick?: (state: State) => void) {
    this.current = state; this.multiplier = config.speedMultiplier;
  }
  get state(): State { return this.current; }
  get running(): boolean { return !this.paused; }
  get canSingleStep(): boolean { return this.paused; }
  get speedMultiplier(): number { return this.multiplier; }
  get pendingTicks(): number { return this.accumulator; }
  get frame(): AnimationFrame { return sampleAnimation(this.current, this.config); }
  private advance(): void {
    this.current = this.compute(this.current);
    this.onTick?.(this.current);
  }
  tick(now: number): void {
    const delta = this.lastTime === undefined ? 0 : Math.max(0, Math.min(maxFrameDeltaMs, now - this.lastTime));
    this.lastTime = now;
    if (this.paused) return;
    this.accumulator = Math.min(maxPendingTicks, this.accumulator + delta * this.multiplier * ticksPerSecond / 1000);
    let count = 0;
    while (this.accumulator >= 1 - 1e-10 && count < maxTicksPerFrame) {
      this.advance();
      this.accumulator = Math.max(0, this.accumulator - 1); count++;
    }
  }
  setSpeedMultiplier(value: number, now: number): void {
    if (!Number.isFinite(value) || value <= 0) throw new ApplicationError('positive', { min: 0 }, 'speedMultiplier');
    this.tick(now); this.multiplier = value;
  }
  toggle(now: number): void {
    if (this.running) this.tick(now);
    this.paused = !this.paused; this.lastTime = now;
  }
  singleStep(now: number): boolean {
    if (!this.paused) return false;
    this.advance(); this.lastTime = now;
    return true;
  }
  reset(state: State, now: number): void {
    this.current = state; this.accumulator = 0; this.lastTime = now;
  }
}

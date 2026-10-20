import { ticksPerSecond } from './config';
import type { State } from './simulation';

export const historySeconds = 300;
export const historyCapacity = historySeconds * ticksPerSecond + 1;
export interface HistorySample {
  readonly tick: number;
  readonly carnivoreCount: number;
  readonly herbivoreCount: number;
  readonly carnivoreEnergy: number;
  readonly herbivoreEnergy: number;
  readonly grassEnergy: number;
}
export type Metric = Exclude<keyof HistorySample, 'tick'>;

/** Measures residents, not the extra shapes used to animate them. */
export function measure(state: State): HistorySample {
  let carnivoreCount = 0, herbivoreCount = 0, carnivoreEnergy = 0, herbivoreEnergy = 0, grassEnergy = 0;
  for (const animal of state.animals) {
    if (animal.species === 'carnivore') { carnivoreCount++; carnivoreEnergy += animal.energy; }
    else { herbivoreCount++; herbivoreEnergy += animal.energy; }
  }
  for (const energy of state.grass) grassEnergy += energy;
  return { tick: state.tick, carnivoreCount, herbivoreCount, carnivoreEnergy, herbivoreEnergy, grassEnergy };
}

/** A run-local ring of numeric samples, independent of visibility and wall time. */
export class History {
  private samples: HistorySample[] = [];
  private start = 0;
  get size(): number { return this.samples.length; }
  get latest(): HistorySample | undefined { return this.samples[(this.start + this.size - 1) % this.size]; }
  record(state: State): void {
    const sample = measure(state);
    if (this.size < historyCapacity) this.samples.push(sample);
    else { this.samples[this.start] = sample; this.start = (this.start + 1) % historyCapacity; }
  }
  reset(state: State): void { this.samples = []; this.start = 0; this.record(state); }
  values(): readonly HistorySample[] {
    return [...this.samples.slice(this.start), ...this.samples.slice(0, this.start)];
  }
}

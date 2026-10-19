import { describe, expect, it } from 'vitest';
import { tick, assertWorld, type State, type TravelAction } from '../src/simulation';
import { advance, fastConfig, resident, testState } from './fixtures';

function until(state: State, predicate: (s: State) => boolean, limit = 1000): State {
  for (let i = 0; i < limit; i++) { if (predicate(state)) return state; state = tick(state, fastConfig, () => 0); }
  throw new Error('Fixture did not reach requested phase');
}
const travelling = (s: State, id: number) => s.animals.find(a => a.id === id)?.action as TravelAction | undefined;
function huntWorld(hunterEnergy = 5, preyEnergy = 8): State {
  const prey = { ...resident(1, 1, 0, preyEnergy), readyAt: 10000 };
  return testState([prey, resident(2, 0, 0, hunterEnergy, 'carnivore')], 0, fastConfig);
}

describe('local hunting', () => {
  it('contacts stationary feeding prey exactly when its meal ends', () => {
    const config = { ...fastConfig, width: 2 };
    let world = testState([resident(1, 1, 0), { ...resident(2, 0, 0, 5, 'carnivore'), readyAt: 2 }], 0, config);
    world.grass[1] = 8;
    world = advance(world, config, 2);
    expect(world.animals[0].capturedBy).toBe(2);
    let finished = -1, contact = -2;
    for (let i = 0; i < 30; i++) {
      world = tick(world, config);
      if (!travelling(world, 1) && finished < 0) finished = world.tick;
      if (travelling(world, 2)?.phase === 'transfer') { contact = world.tick; break; }
    }
    expect(contact).toBe(finished);
    assertWorld(world, config);
  });
  it('runs two hunts on independent contact ticks', () => {
    const config = { ...fastConfig, width: 6 };
    let world = testState([{ ...resident(1, 1, 0, 5), readyAt: 10000 }, resident(2, 0, 0, 5, 'carnivore'),
      { ...resident(3, 4, 0, 5), readyAt: 10000 }, { ...resident(4, 5, 0, 5, 'carnivore'), readyAt: 3 }], 0, config);
    const contacts = new Map<number, number>();
    for (let i = 0; i < 8; i++) {
      world = tick(world, config);
      for (const id of [2, 4]) if (travelling(world, id)?.phase === 'transfer' && !contacts.has(id)) contacts.set(id, world.tick);
    }
    expect(contacts.get(2)).toBe(3); expect(contacts.get(4)).toBe(5);
  });
  it('never claims prey whose arrival cell is outside its neighborhood', () => {
    let world = testState([resident(1, 1, 0), { ...resident(2, 0, 0, 5, 'carnivore'), readyAt: 2 }], 0, fastConfig);
    world.grass[2] = 10;
    world = advance(world, fastConfig, 2);
    expect(world.animals[0].capturedBy).toBeUndefined();
    expect(travelling(world, 2)).toBeUndefined();
  });
  it('completes locally when prey dies during transfer without giving a death bonus', () => {
    let world = until(huntWorld(), s => travelling(s, 2)?.phase === 'transfer');
    world = tick(world, fastConfig);
    const energy = world.animals.find(a => a.id === 2)!.energy;
    world.animals.find(a => a.id === 1)!.energy = 1e-12;
    world = tick(world, fastConfig);
    expect(travelling(world, 2)?.phase).toBe('follow');
    expect(world.animals[0].energy).toBeLessThan(energy);
    assertWorld(world, fastConfig);
  });
  it('reserves one prey and takes its cell only after full consumption and follow-through', () => {
    let world = huntWorld();
    world = until(world, s => travelling(s, 2)?.phase === 'transfer');
    expect(world.animals[0].capturedBy).toBe(2);
    expect(world.animals.find(a => a.id === 2)?.column).toBe(0);
    const before = structuredClone(world);
    world = until(world, s => travelling(s, 2)?.phase === 'follow');
    expect(world.animals.some(a => a.id === 1)).toBe(false);
    expect(world.animals[0].column).toBe(0);
    world = until(world, s => !travelling(s, 2));
    expect(world.animals[0].column).toBe(1);
    expect(world.reservations).toEqual({});
    expect(before.animals[0].capturedBy).toBe(2);
    assertWorld(world, fastConfig);
  });
  it('keeps partial prey alive, preserves its identity and returns the hunter to its own cell', () => {
    // Avoid division before hunting by raising its threshold for this fixture.
    const config = { ...fastConfig, carnivore: { ...fastConfig.carnivore, divisionFraction: 0.99 } };
    let world = huntWorld(18, 10);
    while (!(travelling(world, 2)?.phase === 'transfer')) world = tick(world, config, () => 0);
    const start = structuredClone(world), startTick = world.tick;
    while (!(travelling(world, 2)?.phase === 'return')) world = tick(world, config, () => 0);
    const prey = world.animals.find(a => a.id === 1)!;
    const hunter = world.animals.find(a => a.id === 2)!;
    expect(prey.energy).toBeGreaterThan(5);
    expect(prey.capturedBy).toBeUndefined(); expect(prey.recovery).toBeDefined();
    expect(prey.column).toBe(1); expect(hunter.column).toBe(0);
    const action = travelling(world, 2)!;
    const elapsed = (world.tick - startTick) / 60;
    expect(hunter.energy).toBeCloseTo(start.animals[1].energy - config.carnivore.energyDrainPerSecond * elapsed + action.transferred);
    expect(prey.energy).toBeCloseTo(start.animals[0].energy - config.herbivore.energyDrainPerSecond * elapsed - action.transferred / config.preyEfficiency);
    for (let i = 0; i < config.approachTicks; i++) world = tick(world, config, () => 0);
    expect(world.animals.find(a => a.id === 2)?.column).toBe(0);
    expect(travelling(world, 2)).toBeUndefined();
    expect(world.reservations).toEqual({}); assertWorld(world, config);
  });
  it.each([false, true])('frees prey when hunter dies (after contact=%s)', afterContact => {
    let world = huntWorld();
    world = afterContact ? until(world, s => travelling(s, 2)?.phase === 'transfer') : advance(world, fastConfig, 1);
    world.animals.find(a => a.id === 2)!.energy = 1e-12;
    world = tick(world, fastConfig);
    expect(world.animals.some(a => a.id === 2)).toBe(false);
    expect(world.animals[0].capturedBy).toBeUndefined(); expect(world.reservations).toEqual({});
    assertWorld(world, fastConfig);
  });
  it('gains no phantom energy when prey dies before contact', () => {
    let world = advance(huntWorld(), fastConfig, 1);
    world.animals.find(a => a.id === 1)!.energy = 1e-12;
    const energy = world.animals.find(a => a.id === 2)!.energy;
    world = tick(world, fastConfig);
    expect(travelling(world, 2)?.phase).toBe('return');
    expect(world.animals[0].energy).toBeLessThan(energy);
    world = advance(world, fastConfig, 2);
    expect(world.animals[0].column).toBe(0); assertWorld(world, fastConfig);
  });
  it('allows only one of competing hunters to reserve a prey', () => {
    const world = huntWorld(); world.animals.push(resident(3, 2, 0, 5, 'carnivore'));
    const result = tick(world, fastConfig, () => 0);
    expect(result.animals.filter(a => a.action?.type === 'travel' && a.action.kind === 'hunt')).toHaveLength(1);
    assertWorld(result, fastConfig);
  });
  it('synchronizes a moving prey arrival and hunter contact without delaying unrelated actors', () => {
    let world = testState([resident(1, 2, 0), { ...resident(2, 0, 0, 5, 'carnivore'), readyAt: 2 },
      { ...resident(3, 4, 0, 3, 'carnivore'), readyAt: 1000 }], 0, fastConfig);
    world.grass[1] = 8;
    world = tick(world, fastConfig, () => 0);
    world = tick(world, fastConfig, () => 0);
    expect(world.animals[0].capturedBy).toBe(2);
    let arrival = -1, contact = -2;
    for (let i = 0; i < 30; i++) {
      world = tick(world, fastConfig, () => 0);
      if (!travelling(world, 1) && arrival < 0) arrival = world.tick;
      if (travelling(world, 2)?.phase === 'transfer') { contact = world.tick; break; }
    }
    expect(contact).toBe(arrival);
    expect(world.animals.find(a => a.id === 3)!.energy).toBeLessThan(3);
    assertWorld(world, fastConfig);
  });
  it('can claim a newly divided half on its own arrival path', () => {
    const config = { ...fastConfig, width: 4, height: 2 };
    let world = testState([resident(1, 1, 0, 19), { ...resident(2, 3, 0, 5, 'carnivore'), readyAt: 4 }], 0, config);
    world = advance(world, config, 4, () => 0);
    expect(world.animals).toHaveLength(3);
    // A reachable half may be reserved while its sibling continues its separate action.
    const half = world.animals.find(a => a.capturedBy === 2);
    expect(half).toBeDefined(); expect(half!.action?.type).toBe('travel');
    assertWorld(world, config);
  });
});

describe('bounded constant transfer', () => {
  it.each([2, 4, 4.25])('takes the corresponding number of ticks for %s gross energy', food => {
    const config = { ...fastConfig, width: 1, height: 1 };
    let world = testState([resident(1, 0, 0)], food, config);
    world = tick(world, config);
    const start = world.tick, energy = world.animals[0].energy;
    while (world.animals[0].action) world = tick(world, config);
    const elapsed = world.tick - start;
    expect(elapsed).toBe(Math.ceil(food));
    expect(world.grass[0]).toBe(0);
    expect(world.animals[0].energy).toBeCloseTo(energy + food - config.herbivore.energyDrainPerSecond * elapsed / 60);
  });
  it.each([0, 0.5, 2])('preserves excess grass at efficiency %s and does not extend budget for metabolism', efficiency => {
    const config = { ...fastConfig, width: 1, height: 1, grassEfficiency: efficiency,
      herbivore: { ...fastConfig.herbivore, divisionFraction: 0.99 } };
    let world = testState([resident(1, 0, 0, 18)], 10, config);
    world = tick(world, config);
    const action = travelling(world, 1), budget = action?.budget ?? 0;
    for (let i = 0; world.animals[0].action && i < 100; i++) world = tick(world, config);
    expect(world.animals[0].action).toBeUndefined();
    expect(world.grass[0]).toBeCloseTo(efficiency === 0 ? 10 : 10 - budget / efficiency, 8);
    expect(world.grass[0]).toBeGreaterThan(0);
  });
  it('leaves new growth and does not chase it forever', () => {
    const config = { ...fastConfig, width: 1, height: 1, grassGrowthPerSecond: 1,
      herbivore: { ...fastConfig.herbivore, energyDrainPerSecond: 2 } };
    let world = testState([resident(1, 0, 0)], 2, config);
    world = tick(world, config); const budget = travelling(world, 1)!.budget;
    const start = world.tick;
    while (world.animals[0].action) world = tick(world, config);
    expect(world.tick - start).toBe(Math.ceil(budget));
    expect(world.grass[0]).toBeCloseTo((world.tick - start) / 60);
  });
});

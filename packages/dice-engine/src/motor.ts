import { formatFormula, rollRequest, type RandomSource, type RollRequest, type RollResult } from "./core";

export type DiceMotorSeed = string | number;

export type ThrowVector = {
  spin: [number, number, number];
  tumble: number;
  lift: number;
  drift: number;
  durationMs: number;
};

export type MotorDie = {
  id: string;
  sides: number;
  value: number;
  kept: boolean;
  vector: ThrowVector;
};

export type MotorRoll = {
  id: string;
  seed: string;
  request: Required<Pick<RollRequest, "count" | "sides" | "modifier" | "formula">> & Pick<RollRequest, "label" | "selection">;
  result: RollResult;
  dice: MotorDie[];
  audit: {
    algorithm: "open-dice-motor-v1";
    randomDraws: number;
    checksum: string;
  };
};

export type DiceMotorOptions = {
  seed?: DiceMotorSeed;
};

export class DiceMotor {
  private readonly seed: string;
  private readonly random: RandomSource;
  private draws = 0;

  constructor(options: DiceMotorOptions = {}) {
    this.seed = String(options.seed ?? createRuntimeSeed());
    this.random = mulberry32(hashSeed(this.seed));
  }

  roll(request: RollRequest): MotorRoll {
    const normalized = normalizeRequest(request);
    const result = rollRequest(normalized, () => this.next());
    const rolls = result.dice[0]?.rolls ?? [];
    const dice = rolls.map((value, index) => ({
      id: `${normalized.formula}-${index + 1}-${value}`,
      sides: normalized.sides,
      value,
      kept: result.dice[0].keptIndices.includes(index),
      vector: this.throwVector(value, normalized.sides, index),
    }));
    const checksum = checksumFor(this.seed, normalized.formula, result.total, rolls);

    return {
      id: `${checksum}-${this.draws}`,
      seed: this.seed,
      request: normalized,
      result,
      dice,
      audit: {
        algorithm: "open-dice-motor-v1",
        randomDraws: this.draws,
        checksum,
      },
    };
  }

  private next(): number {
    this.draws += 1;
    return this.random();
  }

  private throwVector(value: number, sides: number, index: number): ThrowVector {
    const faceBias = value / sides;
    return {
      spin: [
        roundVector(2.5 + this.next() * 7 + faceBias),
        roundVector(2 + this.next() * 8 + index * 0.21),
        roundVector(1.5 + this.next() * 6 + faceBias * 0.5),
      ],
      tumble: roundVector(0.75 + this.next() * 1.8),
      lift: roundVector(0.35 + this.next() * 0.85),
      drift: roundVector((this.next() - 0.5) * 1.2),
      durationMs: Math.round(760 + this.next() * 520 + index * 60),
    };
  }
}

export function createDiceMotor(options?: DiceMotorOptions): DiceMotor {
  return new DiceMotor(options);
}

export function rollWithMotor(request: RollRequest, options?: DiceMotorOptions): MotorRoll {
  return createDiceMotor(options).roll(request);
}

function normalizeRequest(request: RollRequest): MotorRoll["request"] {
  const modifier = request.modifier ?? 0;
  return {
    count: request.count,
    sides: request.sides,
    modifier,
    formula: request.formula ?? formatFormula(request.count, request.sides, modifier, request.selection),
    label: request.label,
    selection: request.selection,
  };
}

function createRuntimeSeed(): string {
  const time = Date.now().toString(36);
  const entropy = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
  return `${time}-${entropy}`;
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function checksumFor(seed: string, formula: string, total: number, rolls: number[]): string {
  return hashSeed(`${seed}:${formula}:${total}:${rolls.join(",")}`).toString(36);
}

function roundVector(value: number): number {
  return Math.round(value * 1000) / 1000;
}

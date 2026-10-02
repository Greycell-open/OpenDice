export const STANDARD_DICE = [4, 6, 8, 10, 12, 20, 100] as const;

export type StandardDie = (typeof STANDARD_DICE)[number];

export type RandomSource = () => number;

export type DieRoll = {
  sides: number;
  value: number;
};

export type RollResult = {
  formula: string;
  total: number;
  dice: Array<{
    sides: number;
    rolls: number[];
    kept: number[];
    dropped: number[];
    keptIndices: number[];
  }>;
  modifier: number;
  breakdown: string;
  label?: string;
};

export type RollRequest = {
  count: number;
  sides: number;
  modifier?: number;
  formula?: string;
  label?: string;
  selection?: { mode: "kh" | "kl" | "dh" | "dl"; count: number };
};

export function assertValidDie(sides: number): void {
  if (!Number.isInteger(sides) || sides < 2 || sides > 1000) {
    throw new Error(`Invalid die sides: ${sides}`);
  }
}

export function assertValidCount(count: number): void {
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new Error(`Invalid dice count: ${count}`);
  }
}

export function rollDie(sides: number, random: RandomSource = Math.random): DieRoll {
  assertValidDie(sides);
  const raw = random();
  if (!Number.isFinite(raw) || raw < 0 || raw >= 1) {
    throw new Error("Random source must return a number from 0 inclusive to 1 exclusive");
  }
  return {
    sides,
    value: Math.floor(raw * sides) + 1,
  };
}

export function rollDice(
  count: number,
  sides: number,
  modifier = 0,
  random: RandomSource = Math.random,
  formula?: string,
  label?: string,
  selection?: RollRequest["selection"],
): RollResult {
  assertValidCount(count);
  assertValidDie(sides);
  if (!Number.isSafeInteger(modifier) || Math.abs(modifier) > Number.MAX_SAFE_INTEGER - count * sides) {
    throw new Error(`Invalid modifier: ${modifier}`);
  }

  if (selection && (!['kh', 'kl', 'dh', 'dl'].includes(selection.mode) ||
    !Number.isInteger(selection.count) || selection.count < 1 || selection.count > count ||
    (selection.mode.startsWith('d') && selection.count === count))) {
    throw new Error("Keep/drop count must leave at least one die and cannot exceed the dice count.");
  }
  const rolls = Array.from({ length: count }, () => rollDie(sides, random).value);
  const ranked = rolls.map((value, index) => ({ value, index })).sort((a, b) =>
    (selection?.mode.endsWith('h') ? b.value - a.value : a.value - b.value) || a.index - b.index);
  const selected = new Set(ranked.slice(0, selection?.count ?? count).map((die) => die.index));
  const keptIndices = rolls.flatMap((_, index) =>
    (!selection || (selection.mode.startsWith('k') ? selected.has(index) : !selected.has(index))) ? [index] : []);
  const keptSet = new Set(keptIndices);
  const kept = rolls.filter((_, index) => keptSet.has(index));
  const dropped = rolls.filter((_, index) => !keptSet.has(index));
  const diceTotal = kept.reduce((sum, value) => sum + value, 0);
  const total = diceTotal + modifier;

  return {
    formula: formula ?? formatFormula(count, sides, modifier, selection),
    total,
    dice: [
      {
        sides,
        rolls,
        kept,
        dropped,
        keptIndices,
      },
    ],
    modifier,
    breakdown: formatBreakdown(kept, modifier, total) + (dropped.length ? ` (dropped: ${dropped.join(', ')})` : ''),
    label,
  };
}

export function rollRequest(request: RollRequest, random: RandomSource = Math.random): RollResult {
  return rollDice(
    request.count,
    request.sides,
    request.modifier ?? 0,
    random,
    request.formula ?? formatFormula(request.count, request.sides, request.modifier ?? 0, request.selection),
    request.label,
    request.selection,
  );
}

export function formatFormula(count: number, sides: number, modifier = 0, selection?: RollRequest["selection"]): string {
  const dice = `${count}d${sides}${selection ? `${selection.mode}${selection.count}` : ''}`;
  if (modifier > 0) return `${dice}+${modifier}`;
  if (modifier < 0) return `${dice}${modifier}`;
  return dice;
}

function formatBreakdown(rolls: number[], modifier: number, total: number): string {
  const diceText = rolls.join(" + ");
  if (modifier > 0) return `${diceText} + ${modifier} = ${total}`;
  if (modifier < 0) return `${diceText} - ${Math.abs(modifier)} = ${total}`;
  return `${diceText} = ${total}`;
}

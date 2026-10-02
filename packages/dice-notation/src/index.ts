import type { RollRequest } from "@open-dice/dice-engine";

const MVP_NOTATION = /^\s*(?:(\d{1,3})\s*)?d\s*(%|\d{1,4})(?:\s*(kh|kl|dh|dl)\s*(\d{1,3}))?(?:\s*([+-])\s*(\d{1,4}))?\s*$/i;

export function parseDiceNotation(input: string): RollRequest {
  const formula = input.trim();
  const match = MVP_NOTATION.exec(formula);
  if (!match) {
    throw new Error(`Unsupported dice notation: ${input}`);
  }

  const count = match[1] ? Number.parseInt(match[1], 10) : 1;
  const sides = match[2] === "%" ? 100 : Number.parseInt(match[2], 10);
  const modifierValue = match[6] ? Number.parseInt(match[6], 10) : 0;
  const modifier = match[5] === "-" ? -modifierValue : modifierValue;
  const selection = match[3] ? {
    mode: match[3].toLowerCase() as NonNullable<RollRequest['selection']>['mode'],
    count: Number.parseInt(match[4], 10),
  } : undefined;

  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new Error(`Invalid dice count: ${count}`);
  }
  if (!Number.isInteger(sides) || sides < 2 || sides > 1000) {
    throw new Error(`Invalid die sides: ${sides}`);
  }
  if (selection && (selection.count < 1 || selection.count > count ||
    (selection.mode.startsWith('d') && selection.count === count))) {
    throw new Error("Keep/drop count must leave at least one die and cannot exceed the dice count.");
  }

  return {
    count,
    sides,
    modifier,
    formula: normalizeFormula(count, sides, modifier, selection),
    ...(selection ? { selection } : {}),
  };
}

function normalizeFormula(count: number, sides: number, modifier: number, selection?: RollRequest['selection']): string {
  const dice = `${count}d${sides}${selection ? `${selection.mode}${selection.count}` : ''}`;
  if (modifier > 0) return `${dice}+${modifier}`;
  if (modifier < 0) return `${dice}${modifier}`;
  return dice;
}

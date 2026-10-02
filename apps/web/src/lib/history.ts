import { rollRequest, type RollResult } from '@open-dice/dice-engine';
import { parseDiceNotation } from '@open-dice/dice-notation';

export const HISTORY_KEY = 'open-dice.history.v1';
export const HISTORY_LIMIT = 50;

// Rebuild totals and kept/dropped dice from the saved outcomes, never reroll them.
export function decodeHistory(raw: string | null): RollResult[] {
  if (!raw) return [];
  try {
    const saved = JSON.parse(raw);
    if (saved?.version !== 1 || !Array.isArray(saved.entries)) return [];
    return saved.entries.slice(0, HISTORY_LIMIT).flatMap((entry: unknown) => {
      try {
        if (!entry || typeof entry !== 'object') return [];
        const { formula, rolls } = entry as { formula?: unknown; rolls?: unknown };
        if (typeof formula !== 'string' || !Array.isArray(rolls)) return [];
        const request = parseDiceNotation(formula);
        if (rolls.length !== request.count || !rolls.every((value) =>
          Number.isInteger(value) && value >= 1 && value <= request.sides)) return [];
        let index = 0;
        return [rollRequest(request, () => (rolls[index++] - 0.5) / request.sides)];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

export function encodeHistory(history: RollResult[]): string {
  return JSON.stringify({ version: 1, entries: history.slice(0, HISTORY_LIMIT).map((result) => ({
    formula: result.formula, rolls: result.dice[0].rolls,
  })) });
}

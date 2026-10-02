import { describe, expect, it } from "vitest";
import { rollDice, rollDie, rollRequest } from "../src/index";

function sequence(values: number[]) {
  let index = 0;
  return () => values[index++ % values.length];
}

describe("dice engine", () => {
  it("rolls a single die within range", () => {
    expect(rollDie(20, () => 0).value).toBe(1);
    expect(rollDie(20, () => 0.999).value).toBe(20);
  });

  it("rolls multiple dice with a modifier", () => {
    const result = rollDice(2, 6, 3, sequence([0, 0.5]));
    expect(result.total).toBe(8);
    expect(result.dice[0].rolls).toEqual([1, 4]);
    expect(result.breakdown).toBe("1 + 4 + 3 = 8");
  });

  it("rolls a structured request", () => {
    const result = rollRequest({ count: 1, sides: 20, modifier: -1, formula: "1d20-1" }, () => 0.95);
    expect(result.total).toBe(19);
    expect(result.formula).toBe("1d20-1");
  });

  it("rejects invalid dice", () => {
    expect(() => rollDie(1)).toThrow(/Invalid die sides/);
    expect(() => rollDice(0, 6)).toThrow(/Invalid dice count/);
  });

  it.each([
    ['kh', [6, 6], [1, 3], 14],
    ['kl', [1, 3], [6, 6], 6],
    ['dh', [1, 3], [6, 6], 6],
    ['dl', [6, 6], [1, 3], 14],
  ] as const)('handles %s without losing tied dice', (mode, kept, dropped, total) => {
    const result = rollRequest({ count: 4, sides: 6, modifier: 2, selection: { mode, count: 2 } }, sequence([0, 0.9, 0.4, 0.9]));
    expect(result.dice[0].rolls).toEqual([1, 6, 3, 6]);
    expect(result.dice[0].kept).toEqual(kept);
    expect(result.dice[0].dropped).toEqual(dropped);
    expect(result.total).toBe(total);
    expect(result.formula).toBe(`4d6${mode}2+2`);
  });

  it('drops only one of equal-valued dice with a stable index', () => {
    const result = rollRequest({ count: 4, sides: 6, selection: { mode: 'dl', count: 1 } }, () => 0.5);
    expect(result.dice[0].keptIndices).toEqual([1, 2, 3]);
    expect(result.dice[0].dropped).toEqual([4]);
    expect(result.total).toBe(12);
  });

  it('keeps all dice and supports negative totals', () => {
    expect(rollRequest({ count: 2, sides: 6, selection: { mode: 'kh', count: 2 }, modifier: -5 }, () => 0).total).toBe(-3);
  });

  it.each([0, -1, 1.5, 5, NaN])('rejects invalid selection count %s before drawing randomness', (count) => {
    let calls = 0;
    expect(() => rollRequest({ count: 4, sides: 6, selection: { mode: 'kh', count } }, () => { calls++; return 0; })).toThrow();
    expect(calls).toBe(0);
  });

  it('rejects dropping every die and unsafe totals', () => {
    expect(() => rollRequest({ count: 2, sides: 6, selection: { mode: 'dh', count: 2 } })).toThrow();
    expect(() => rollDice(1, 6, Number.MAX_SAFE_INTEGER)).toThrow(/modifier/);
  });

  it.each([-1, 1, Infinity, NaN])('rejects invalid random output %s', (value) => {
    expect(() => rollDie(6, () => value)).toThrow(/Random source/);
  });
});

import { describe, expect, it } from "vitest";
import { parseDiceNotation } from "../src/index";

describe("dice notation", () => {
  it.each([
    ["d20", { count: 1, sides: 20, modifier: 0, formula: "1d20" }],
    ["1d20", { count: 1, sides: 20, modifier: 0, formula: "1d20" }],
    ["1d20 + 5", { count: 1, sides: 20, modifier: 5, formula: "1d20+5" }],
    ["2d6", { count: 2, sides: 6, modifier: 0, formula: "2d6" }],
    ["8d6", { count: 8, sides: 6, modifier: 0, formula: "8d6" }],
    ["d100", { count: 1, sides: 100, modifier: 0, formula: "1d100" }],
    ["d%", { count: 1, sides: 100, modifier: 0, formula: "1d100" }],
  ])("parses %s", (input, expected) => {
    expect(parseDiceNotation(input)).toEqual(expected);
  });

  it("rejects unsupported notation", () => {
    expect(() => parseDiceNotation("2d20!")).toThrow(/Unsupported/);
    expect(() => parseDiceNotation("not dice")).toThrow(/Unsupported/);
  });

  it.each(['kh', 'kl', 'dh', 'dl'] as const)('parses %s with whitespace and modifiers', (mode) => {
    expect(parseDiceNotation(` 4 D 6 ${mode.toUpperCase()} 1 - 2 `)).toEqual({
      count: 4, sides: 6, selection: { mode, count: 1 }, modifier: -2, formula: `4d6${mode}1-2`,
    });
  });
  it.each(['0d6', '101d6', 'd1', 'd1001', '2d20kh0', '2d20kl3', '4d6dl4', 'd6dh1', '2d6kh1dl1', 'd6+1.5'])('rejects invalid %s', (input) => {
    expect(() => parseDiceNotation(input)).toThrow();
  });
});

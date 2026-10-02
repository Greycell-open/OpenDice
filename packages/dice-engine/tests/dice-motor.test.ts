import { describe, expect, it } from "vitest";
import { createDiceMotor, rollWithMotor } from "../src/index";

describe("dice motor", () => {
  it("produces deterministic rolls from a seed", () => {
    const first = rollWithMotor({ count: 2, sides: 6, modifier: 1, formula: "2d6+1" }, { seed: "open-dice" });
    const second = rollWithMotor({ count: 2, sides: 6, modifier: 1, formula: "2d6+1" }, { seed: "open-dice" });

    expect(second.result).toEqual(first.result);
    expect(second.dice).toEqual(first.dice);
    expect(second.audit.checksum).toBe(first.audit.checksum);
  });

  it("creates animation vectors for every die", () => {
    const motor = createDiceMotor({ seed: "vector-test" });
    const roll = motor.roll({ count: 3, sides: 8 });

    expect(roll.dice).toHaveLength(3);
    expect(roll.dice[0].vector.spin).toHaveLength(3);
    expect(roll.dice[0].vector.durationMs).toBeGreaterThanOrEqual(760);
    expect(roll.audit.algorithm).toBe("open-dice-motor-v1");
  });

  it("advances state across rolls", () => {
    const motor = createDiceMotor({ seed: "campaign-session" });
    const first = motor.roll({ count: 1, sides: 20 });
    const second = motor.roll({ count: 1, sides: 20 });

    expect(second.id).not.toBe(first.id);
    expect(second.audit.randomDraws).toBeGreaterThan(first.audit.randomDraws);
  });

  it('preserves keep/drop requests, individual dice and deterministic animation', () => {
    const request = { count: 4, sides: 6, selection: { mode: 'dl' as const, count: 1 }, modifier: 2 };
    const first = rollWithMotor(request, { seed: 'ability-score' });
    expect(rollWithMotor(request, { seed: 'ability-score' })).toEqual(first);
    expect(first.request.selection).toEqual(request.selection);
    expect(first.result.formula).toBe('4d6dl1+2');
    expect(first.dice).toHaveLength(4);
    expect(first.dice.filter((die) => die.kept)).toHaveLength(3);
    expect(first.dice.filter((die) => die.kept).reduce((sum, die) => sum + die.value, 2)).toBe(first.result.total);
  });
});

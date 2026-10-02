import { describe, expect, it } from 'vitest';
import { rollRequest } from '@open-dice/dice-engine';
import { decodeHistory, encodeHistory } from '../src/lib/history';

describe('browser history format', () => {
  it('restores original outcomes and keep/drop totals without random rerolls', () => {
    const result = rollRequest({ count: 4, sides: 6, selection: { mode: 'dl', count: 1 }, modifier: 2 }, () => 0.5);
    expect(decodeHistory(encodeHistory([result]))).toEqual([result]);
  });
  it.each([null, 'invalid json', '{}', '{"version":2,"entries":[]}', '{"version":1,"entries":null}'])('recovers from malformed storage %s', (raw) => {
    expect(decodeHistory(raw)).toEqual([]);
  });
  it('skips corrupt entries while preserving valid records and recomputing totals', () => {
    const result = decodeHistory(JSON.stringify({ version: 1, entries: [
      null, {formula:'d6',rolls:[7]}, {formula:'2d6',rolls:[1]}, {formula:'d6',rolls:['2']},
      {formula:'d6',rolls:[3],total:999},
    ] }));
    expect(result).toHaveLength(1);
    expect(result[0].total).toBe(3);
  });
  it('limits saved and restored history to 50 rolls', () => {
    const result = rollRequest({ count: 1, sides: 6 }, () => 0);
    expect(decodeHistory(encodeHistory(Array(70).fill(result)))).toHaveLength(50);
    expect(decodeHistory(JSON.stringify({version:1,entries:Array(70).fill({formula:'d6',rolls:[1]})}))).toHaveLength(50);
  });
});

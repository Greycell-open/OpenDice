import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { createDiceModel, MODEL_SIDES, percentileFaces, restHeight, resultOrientation } from '../src/dice3d/diceModels';

describe('physical dice models', () => {
  it.each(MODEL_SIDES)('builds the correct planar faces for d%s', (sides) => {
    const model = createDiceModel(sides);
    expect(model.faces).toHaveLength(sides);
    expect(model.faces.map((face) => face.value).sort((a, b) => a - b)).toEqual(Array.from({length:sides}, (_, i) => i + 1));
    for (const face of model.faces) {
      expect(face.vertices).toHaveLength(sides === 6 || sides === 10 ? 4 : sides === 12 ? 5 : 3);
      expect(face.radius).toBeGreaterThan(0.2);
      expect(face.center.dot(face.normal)).toBeGreaterThan(0);
      for (const vertex of face.vertices) {
        expect(Math.abs(vertex.clone().sub(face.center).dot(face.normal))).toBeLessThan(1e-5);
      }
      expect(new Vector3(0, 0, 1).applyQuaternion(face.rotation).dot(face.normal)).toBeCloseTo(1, 6);
    }
    model.geometry.dispose();
  });

  it.each(MODEL_SIDES)('places every d%s result upward and rests above the tray', (sides) => {
    const model = createDiceModel(sides);
    for (let value = 1; value <= sides; value++) {
      const orientation = resultOrientation(model, value);
      const resultDirection = sides === 4 ? model.vertices[value - 1].clone().normalize() :
        model.faces.find((face) => face.value === value)!.normal.clone();
      expect(resultDirection.applyQuaternion(orientation).y).toBeCloseTo(1, 6);
      const height = restHeight(model, orientation);
      const positions = model.geometry.getAttribute('position');
      const ys = Array.from({length:positions.count}, (_, i) =>
        new Vector3().fromBufferAttribute(positions, i).applyQuaternion(orientation).y + height);
      expect(Math.min(...ys)).toBeCloseTo(0.012, 6);
      // At least a triangle supports the settled body, not an edge or point.
      const supporting = new Set(Array.from({length:positions.count}, (_, i) => {
        const p = new Vector3().fromBufferAttribute(positions, i).applyQuaternion(orientation);
        return Math.abs(p.y + height - 0.012) < 1e-5 ? p.toArray().map(n => n.toFixed(4)).join(',') : '';
      }).filter(Boolean));
      expect(supporting.size).toBeGreaterThanOrEqual(3);
    }
    model.geometry.dispose();
  });

  it.each([6, 8, 10, 12, 20])('numbers opposite d%s faces with the correct sum', (sides) => {
    const model = createDiceModel(sides);
    for (const face of model.faces) {
      const opposite = model.faces.find((other) => other.normal.dot(face.normal) < -0.99999);
      expect(opposite).toBeDefined();
      expect(face.value + opposite!.value).toBe(sides + 1);
    }
    model.geometry.dispose();
  });

  it.each(Array.from({length:100}, (_, i) => i + 1))('represents percentile %s with the correct tens and units', (value) => {
    const [tens, ones] = percentileFaces(value);
    expect(tens).toBeGreaterThanOrEqual(1);
    expect(tens).toBeLessThanOrEqual(10);
    expect(ones).toBeGreaterThanOrEqual(1);
    expect(ones).toBeLessThanOrEqual(10);
    expect((tens % 10 * 10 + ones % 10) || 100).toBe(value);
  });

  it('does not pretend arbitrary dice are d20s', () => {
    expect(() => createDiceModel(7)).toThrow(/No physical model/);
    const model = createDiceModel(6);
    expect(() => resultOrientation(model, 7)).toThrow(/Invalid face/);
    expect(() => percentileFaces(0)).toThrow(/Invalid percentile/);
    model.geometry.dispose();
  });
});

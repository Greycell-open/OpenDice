import {
  BoxGeometry, BufferGeometry, DodecahedronGeometry, IcosahedronGeometry,
  Matrix4, OctahedronGeometry, Quaternion, TetrahedronGeometry, Vector3,
} from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';

export type DiceFace = {
  value: number;
  vertices: Vector3[];
  center: Vector3;
  normal: Vector3;
  up: Vector3;
  rotation: Quaternion;
  radius: number;
};
export type DiceModel = {
  sides: number;
  geometry: BufferGeometry;
  faces: DiceFace[];
  vertices: Vector3[];
};

export const MODEL_SIDES = [4, 6, 8, 10, 12, 20] as const;
const UP = new Vector3(0, 1, 0);
const BEVEL = 0.065;

function vertexKey(v: Vector3): string {
  return v.toArray().map((n) => n.toFixed(5)).join(',');
}

export function faceRotation(normal: Vector3, up: Vector3): Quaternion {
  const right = up.clone().cross(normal).normalize();
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(right, up, normal));
}

// A pentagonal trapezohedron, not the eight/ten triangular faces of a bipyramid.
// The alternating ring height makes each four-cornered kite exactly planar.
function d10Geometry(): BufferGeometry {
  const pole = 1.32;
  const ringHeight = pole * Math.tan(Math.PI / 10) ** 2;
  const points = [new Vector3(0, pole, 0), new Vector3(0, -pole, 0)];
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI / 5;
    points.push(new Vector3(Math.cos(angle), i % 2 === 0 ? ringHeight : -ringHeight, Math.sin(angle)));
  }
  return new ConvexGeometry(points);
}

function rawGeometry(sides: number): BufferGeometry {
  switch (sides) {
    case 4: return new TetrahedronGeometry(1.32);
    case 6: return new BoxGeometry(1.72, 1.72, 1.72);
    case 8: return new OctahedronGeometry(1.32);
    case 10: return d10Geometry();
    case 12: return new DodecahedronGeometry(1.23);
    case 20: return new IcosahedronGeometry(1.25);
    default: throw new Error(`No physical model for d${sides}`);
  }
}

export function createDiceModel(sides: number): DiceModel {
  const original = rawGeometry(sides);
  const source = original.index ? original.toNonIndexed() : original;
  const positions = source.getAttribute('position');
  const groups: Array<{ normal: Vector3; vertices: Map<string, Vector3> }> = [];
  for (let i = 0; i < positions.count; i += 3) {
    const triangle = [0, 1, 2].map((offset) => new Vector3().fromBufferAttribute(positions, i + offset));
    const normal = triangle[1].clone().sub(triangle[0]).cross(triangle[2].clone().sub(triangle[0])).normalize();
    let group = groups.find((candidate) => candidate.normal.dot(normal) > 1 - 1e-5);
    if (!group) { group = { normal, vertices: new Map() }; groups.push(group); }
    triangle.forEach((vertex) => group.vertices.set(vertexKey(vertex), vertex));
  }

  const faces: DiceFace[] = groups.map(({ normal, vertices }) => {
    const points = [...vertices.values()];
    const center = points.reduce((sum, p) => sum.add(p), new Vector3()).divideScalar(points.length);
    const nearestCorner = sides === 6 ? [...points.slice(1)].sort((a, b) =>
      a.distanceToSquared(points[0]) - b.distanceToSquared(points[0]))[0] : null;
    const up = nearestCorner ? nearestCorner.clone().sub(points[0]).normalize() : points[0].clone().sub(center).normalize();
    const right = up.clone().cross(normal).normalize();
    points.sort((a, b) => {
      const pa = a.clone().sub(center), pb = b.clone().sub(center);
      return Math.atan2(pa.dot(up), pa.dot(right)) - Math.atan2(pb.dot(up), pb.dot(right));
    });
    // Distance to the nearest edge gives a safe footprint for printed markings.
    const radius = Math.min(...points.map((p, index) => {
      const edge = points[(index + 1) % points.length].clone().sub(p);
      return center.clone().sub(p).cross(edge).length() / edge.length();
    }));
    return { value: 0, vertices: points, center, normal, up, rotation: faceRotation(normal, up), radius };
  });

  // Opposite sides sum to N + 1 for the centrally symmetric shapes (including d6).
  let next = 1;
  for (const face of faces) {
    if (face.value) continue;
    face.value = next;
    const opposite = faces.find((other) => other !== face && !other.value && other.normal.dot(face.normal) < -1 + 1e-5);
    if (opposite) opposite.value = sides + 1 - next;
    next++;
  }

  const vertices = [...new Map(faces.flatMap((face) => face.vertices).map((p) => [vertexKey(p), p])).values()];
  // Inset every polygon's corners, then hull the points to form real chamfered edges.
  const geometry = new ConvexGeometry(faces.flatMap((face) => face.vertices.map((p) => p.clone().lerp(face.center, BEVEL))));
  if (source !== original) source.dispose();
  original.dispose();
  return { sides, faces, vertices, geometry };
}

export function resultOrientation(model: DiceModel, value: number): Quaternion {
  if (!Number.isInteger(value) || value < 1 || value > model.sides) throw new Error('Invalid face value');
  if (model.sides === 4) {
    // A real tetrahedron rests on a face: read the repeated number at the top vertex.
    return new Quaternion().setFromAxisAngle(UP, 0.25).multiply(
      new Quaternion().setFromUnitVectors(model.vertices[value - 1].clone().normalize(), UP),
    );
  }
  const face = model.faces.find((candidate) => candidate.value === value)!;
  const screenUp = new Vector3(-4.8, 0, -7.6).normalize();
  if (model.sides === 6) screenUp.applyAxisAngle(UP, 0.36);
  return faceRotation(UP, screenUp).multiply(face.rotation.clone().invert());
}

export function restHeight(model: DiceModel, rotation: Quaternion): number {
  const points = model.geometry.getAttribute('position');
  let lowest = Infinity;
  for (let i = 0; i < points.count; i++) {
    lowest = Math.min(lowest, new Vector3().fromBufferAttribute(points, i).applyQuaternion(rotation).y);
  }
  return -lowest + 0.012;
}

export function percentileFaces(value: number): [number, number] {
  if (!Number.isInteger(value) || value < 1 || value > 100) throw new Error('Invalid percentile value');
  const normalized = value % 100;
  return [Math.floor(normalized / 10) || 10, normalized % 10 || 10];
}

import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace, type Quaternion, type Vector3 } from 'three';

const PIPS: Record<number, Array<[number, number]>> = {
  1: [[0, 0]],
  2: [[-1, 1], [1, -1]],
  3: [[-1, 1], [0, 0], [1, -1]],
  4: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
  5: [[-1, -1], [-1, 1], [0, 0], [1, -1], [1, 1]],
  6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]],
};

function makeMark(text: string, pips: boolean, gold: boolean): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas labels unavailable');
  const ink = gold ? '#eed09a' : '#252025';
  if (pips) {
    for (const [x, y] of PIPS[Number(text)]) {
      const px = 128 + x * 69, py = 128 + y * 69;
      // Shaded rims give the printed pip wells depth without external textures.
      const gradient = context.createRadialGradient(px - 4, py - 5, 1, px, py, 23);
      gradient.addColorStop(0, '#090b10');
      gradient.addColorStop(0.78, '#24232b');
      gradient.addColorStop(0.94, '#62594e');
      gradient.addColorStop(1, '#bdb29d');
      context.fillStyle = gradient;
      context.beginPath(); context.arc(px, py, 23, 0, Math.PI * 2); context.fill();
    }
  } else {
    context.fillStyle = ink;
    context.font = '700 166px Georgia, serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = gold ? '#120e08' : '#ffffff';
    context.shadowOffsetY = 1.5;
    context.shadowBlur = 1;
    context.fillText(text, 128, 132, 228);
    if (text === '6' || text === '9') context.fillRect(94, 222, 68, 9);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function FaceMark({ text, pips = false, gold = false, position, rotation, size }: {
  text: string; pips?: boolean; gold?: boolean; position: Vector3; rotation: Quaternion; size: number;
}) {
  const map = useMemo(() => makeMark(text, pips, gold), [text, pips, gold]);
  useEffect(() => () => map.dispose(), [map]);
  return <mesh position={position} quaternion={rotation}>
    <planeGeometry args={[size, size]} />
    <meshStandardMaterial map={map} transparent alphaTest={0.08} depthWrite={false}
      roughness={0.8} metalness={gold ? 0.25 : 0} polygonOffset polygonOffsetFactor={-1} />
  </mesh>;
}

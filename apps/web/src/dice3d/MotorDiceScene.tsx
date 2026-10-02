import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import type { MotorDie, MotorRoll, RollResult } from '@open-dice/dice-engine';
import { Component, type ReactNode, useEffect, useMemo, useRef } from 'react';
import { Euler, Quaternion, type Group } from 'three';
import { FaceMark } from './FaceMark';
import { WebGLHelp } from './webgl';
import { createDiceModel, faceRotation, MODEL_SIDES, percentileFaces, restHeight, resultOrientation } from './diceModels';

export function MotorDiceScene({ motorRoll, reducedMotion, result, rollKey, idle = false }: {
  motorRoll: MotorRoll; reducedMotion: boolean; result: RollResult; rollKey: number;
  /** Before the first roll: the model is on show, not a result. */
  idle?: boolean;
}) {
  const die = motorRoll.dice[0];
  const supported = die.sides === 100 || MODEL_SIDES.some((sides) => sides === die.sides);
  const percentile = die.sides === 100 ? percentileFaces(die.value) : null;
  return <div className="dice-scene" role="img"
    aria-label={idle ? `A 3D d${die.sides}, ready to roll. Drag to inspect.`
      : `Die 1 of ${motorRoll.dice.length}: d${die.sides}, value ${die.value}, ${die.kept ? 'kept' : 'dropped'}. ${!supported ? 'Text preview.' : die.sides === 4 ? 'Read the repeated number at the top point.' : 'Read the upper face.'} Total ${result.total}.`}>
    <div className="dice-scene-fallback" aria-hidden="true"><span>d{die.sides}</span><strong>{die.value}</strong></div>
    {supported && <SceneBoundary><Canvas shadows frameloop="demand" dpr={[1, 1.5]} fallback={<span />}
      camera={{ position: [4.8, 5.8, 7.6], fov: 30 }}>
      <color attach="background" args={['#0c1118']} />
      <ambientLight intensity={0.85} />
      <hemisphereLight args={['#fff2da', '#172b35', 1.2]} />
      <directionalLight position={[2, 7, 4]} intensity={3} castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4}
        shadow-normalBias={0.025} shadow-bias={-0.0001} shadow-radius={3} />
      <directionalLight position={[-4, 2, -3]} color="#94b9e2" intensity={1.5} />
      {percentile ? <>
        <NumberedDie key={`${rollKey}-tens`} die={die} sides={10} value={percentile[0]} reducedMotion={reducedMotion} x={-1.05} scale={0.78} marking="tens" />
        <NumberedDie key={`${rollKey}-ones`} die={die} sides={10} value={percentile[1]} reducedMotion={reducedMotion} x={1.05} scale={0.78} marking="ones" />
      </> : <NumberedDie key={rollKey} die={die} sides={die.sides} value={die.value} reducedMotion={reducedMotion} />}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[2.9, 2.95, 0.18, 96]} />
        <meshStandardMaterial color="#172a2c" roughness={0.97} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <torusGeometry args={[2.86, 0.028, 8, 96]} />
        <meshStandardMaterial color="#a98650" roughness={0.44} metalness={0.65} />
      </mesh>
      <OrbitControls target={[0, 0.6, 0]} enablePan={false} enableZoom={false}
        minPolarAngle={0.15} maxPolarAngle={Math.PI / 2.2} />
    </Canvas></SceneBoundary>}
    {idle ? <p className="scene-caption">d{die.sides} · Drag to inspect · Roll to throw</p> : <p className="scene-caption">
      {supported ? `Die 1 of ${motorRoll.dice.length}` : `d${die.sides} · Text preview`} · {die.kept ? 'Kept' : 'Dropped from total'}
      {die.sides === 4 ? ' · Read the top point' : ''}
      {percentile ? ' · Tens + ones (00 + 0 = 100)' : ''}
      {supported ? ' · Drag to inspect' : ''}
    </p>}
  </div>;
}

class SceneBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
  render() { return this.state.error ? <WebGLHelp reason={this.state.error} /> : this.props.children; }
}

function NumberedDie({ die, sides, value, reducedMotion, x = 0, scale = 1, marking = 'normal' }: {
  die: MotorDie; sides: number; value: number; reducedMotion: boolean;
  x?: number; scale?: number; marking?: 'normal' | 'tens' | 'ones';
}) {
  const group = useRef<Group>(null);
  const model = useMemo(() => createDiceModel(sides), [sides]);
  useEffect(() => () => model.geometry.dispose(), [model]);
  const settled = useMemo(() => resultOrientation(model, value), [model, value]);
  const height = useMemo(() => restHeight(model, settled) * scale, [model, settled, scale]);
  const elapsed = useRef(0);
  const spin = useMemo(() => new Quaternion(), []);
  const euler = useMemo(() => new Euler(), []);

  useFrame((state, delta) => {
    if (!group.current) return;
    elapsed.current += delta * 1000;
    const t = reducedMotion ? 1 : Math.min(elapsed.current / die.vector.durationMs, 1);
    const remaining = (1 - t) ** 3;
    euler.set(...die.vector.spin.map((turn) => turn * remaining) as [number, number, number]);
    spin.setFromEuler(euler);
    group.current.quaternion.copy(settled).multiply(spin);
    group.current.position.set(
      x + (-1.1 + die.vector.drift) * remaining,
      height + 1.5 * remaining + Math.sin(t * Math.PI) * die.vector.lift,
      0.5 * remaining,
    );
    if (t < 1) state.invalidate();
  });

  const gold = marking === 'tens';
  return <group ref={group} position={[x, height, 0]} quaternion={settled} scale={scale}>
    <mesh geometry={model.geometry} castShadow receiveShadow>
      <meshPhysicalMaterial color={gold ? '#163448' : '#eadfca'} roughness={0.32}
        metalness={0.08} clearcoat={0.32} clearcoatRoughness={0.3} />
    </mesh>
    {model.faces.flatMap((face) => {
      if (sides === 4) {
        return face.vertices.map((vertex) => {
          const index = model.vertices.findIndex((candidate) => candidate.distanceTo(vertex) < 1e-5);
          const up = vertex.clone().sub(face.center).normalize();
          return <FaceMark key={`${face.value}-${index}`} text={String(index + 1)} size={0.44}
            position={face.center.clone().lerp(vertex, 0.5).addScaledVector(face.normal, 0.003)}
            rotation={faceRotation(face.normal, up)} />;
        });
      }
      const text = marking === 'tens' ? String(face.value % 10 * 10).padStart(2, '0') :
        marking === 'ones' ? String(face.value % 10) : String(face.value);
      return [<FaceMark key={face.value} text={text} pips={sides === 6} gold={gold}
        size={face.radius * (sides === 6 ? 1.72 : 1.8)}
        position={face.center.clone().addScaledVector(face.normal, 0.003)} rotation={face.rotation} />];
    })}
  </group>;
}

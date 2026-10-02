# Architecture

Open Dice separates dice logic from presentation.

## Packages

- `packages/dice-engine`: random roll execution, structured roll results, and Open Dice Motor output.
- `packages/dice-engine/src/motor.ts`: seed/checksum metadata plus animation-ready throw vectors.
- `packages/dice-notation`: MVP formula parser that returns roll requests.
- `apps/web`: React UI, roll controls, history, pages, and 3D presentation.
- `packages/dice-models`: OpenSCAD source files and model export folders.

## Result Principle

The numeric result and any visible 3D result must not contradict each other.

The current MVP uses result-first animation. Physics-first rolling may be added later only after upward-face detection is reliable and tested.

## Open Dice Motor

The motor is the bridge between dice logic and 3D presentation. It wraps a roll request into an official result plus per-die throw vectors. Web animation code should consume this output instead of creating separate randomness.

## Dice Animation Direction

Dice animations live in `apps/web/src/dice3d/`. `MotorDiceScene.tsx` consumes motor vectors for lift, drift, spin and settle motion. `diceModels.ts` owns geometry, face frames, result orientation and support height. `FaceMark.tsx` creates local canvas markings attached to polygon surfaces; no external fonts or image assets are fetched.

The standard polyhedra use grouped coplanar triangles. The d10 is a true pentagonal trapezohedron with ten planar kite faces. Insetting face corners and taking their convex hull produces physical bevels. Numbered opposing faces sum to N + 1; d4 instead uses repeated vertex labels. A result quaternion aligns the chosen face normal (or tetrahedral vertex) to world up, and support height is measured from the bevelled mesh. All supported values are tested for orientation and stable contact above the tray.

Percentile values map to two d10 faces, with 10 representing digit zero. The tens die uses 00–90, the units die uses 0–9, and double zero means 100. The scene still previews the first motor die; arbitrary side counts have a text fallback. Physics collisions and multi-die choreography are not implemented.

## Testing

Dice logic, notation parsing, motor selection metadata and history serialization have Vitest coverage. Run `npm test` from the root. The web workspace resolves its engine and parser imports through its existing Vite aliases.

## Keep/drop and history

`RollRequest.selection` carries `kh`, `kl`, `dh`, or `dl` and a positive count. The engine returns all rolled values, kept/dropped values and original `keptIndices`. Motor dice carry a `kept` flag; animation does not choose winners independently. Ties use original order and modifiers are applied only after selection.

History stores versioned formulas and raw die values only. `apps/web/src/lib/history.ts` validates and reconstructs results through the engine, so persisted totals cannot override dice outcomes. Malformed records are skipped. Storage access is guarded, capped at 50 entries, and remains local; cross-tab synchronisation is not implemented.

The roller starts in an explicit empty state. The 3D module is lazy-loaded with a loading state and error boundary. The scene also catches renderer errors, uses a per-roll component key to reset elapsed time, and renders on demand until settled. Mesh and texture resources are disposed when their dice unmount.

## CSS

The web app imports three CSS layers:

- `base.css`: shared design tokens and component defaults.
- `desktop.css`: desktop layout.
- `mobile.css`: tablet and phone layout.

The shared application shell supplies a keyboard skip link, `aria-current`
navigation, an explicit local-session footer, and text-first roll status. Page
content remains React state rather than URL routing so the static build works
unchanged at both a site root and `/run/open-dice/`. Supporting pages reuse the
same feature-card and content-page patterns; viewport-specific ordering and
dimensions remain confined to the desktop and mobile layers.

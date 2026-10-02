# Open Dice

Open Dice is a professional open-source dice platform for tabletop players, Game Masters, makers, and developers.

It provides:

- A polished browser dice roller.
- Result-first 3D dice throw visuals.
- Open Dice Motor roll orchestration for animation-ready throws.
- Dice notation parsing.
- Persistent browser roll history, reroll and clear/undo controls.
- Quick dice, advantage/disadvantage and ability-score shortcuts.
- Parametric 3D-printable dice model sources.
- Open documentation for contributors and makers.

Open Dice is for tabletop games, board games, education, probability experiments, makers, and open-source development. It is not a gambling, betting, casino, or crypto project.


## Build on the dice

Editable models of all six dice (d4 to d20) are in
[`packages/dice-models`](packages/dice-models): parametric OpenSCAD files with
engraved numbers, OBJ for Blender, print-ready STL, and a face map of which
number sits where. They are generated from the roller's own geometry with
`npm run models`. The roller's 3D code is in `apps/web/src/dice3d/`, the roll
logic in `packages/dice-engine` and the notation parser in
`packages/dice-notation`, each tested on its own.

## Download and run

Windows: download `OpenDice.exe` from the
[latest release](https://github.com/Greycell-open/OpenDice/releases/latest) and
double-click it. It opens Open Dice in your browser from your own computer
(http://127.0.0.1:5179); nothing is installed and nothing is uploaded. Close
its window to stop it. The exe is unsigned, so Windows may ask once.

To build it yourself: `npm ci`, then `npm run exe` (writes `OpenDice.exe` in this folder).
The 3D dice need WebGL; if your browser has graphics acceleration off, the app
says so and still shows exact results.

## Status

This repository contains a polished, functional web MVP. The roller, local
history, notation packages, motor-driven 3D preview, and responsive application
shell are ready for local use. Collision physics, full multi-die choreography,
and validated printable exports remain later work rather than implied features.

## Stack

- Monorepo: npm workspaces
- Web: React + Vite + TypeScript
- 3D: Three.js + React Three Fiber
- Tests: Vitest
- Printable model source: OpenSCAD
- License: MIT for the code, CC BY 4.0 for the dice models

## Structure

```txt
apps/
  web/                 React web app
packages/
  dice-engine/         Dice rolling logic and Open Dice Motor
  dice-notation/       MVP dice notation parser
  dice-models/         OpenSCAD model sources and export folders
docs/
  development/         Contributor and architecture docs
  printing/            3D printing notes
  product/             Product scope and positioning
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the web app:

```bash
npm run dev
```

Then open the Vite local URL, normally:

```txt
http://localhost:5173
```

Build the website for deployment:

```bash
npm run site:build
```

Deploy this folder (see "Where it runs" below):

```txt
apps/web/dist/
```

## Where it runs

Open Dice is live on the Greycell app hub at
https://greycell.app/run/open-dice/ (since 2026-09-30). The build uses a
relative base (`base: "./"` in `apps/web/vite.config.ts`), so the same
`apps/web/dist/` works at a site root or in a subfolder. To update the hub
copy, build and place `apps/web/dist/` in the hub's `run/open-dice/` folder; the
hub's own README covers its deployment. Source code:
https://github.com/Greycell-open/OpenDice (code MIT, dice models CC BY 4.0, by Zein Alaouie). The app logo lives in
`logo/`; the favicon, app icons and header mark in `apps/web/public/` are cut
from it.

## CSS Layout

The web app keeps responsive CSS split by intent:

- `apps/web/src/styles/base.css`: shared tokens and component basics.
- `apps/web/src/styles/desktop.css`: desktop layout rules.
- `apps/web/src/styles/mobile.css`: tablet/mobile layout rules.

The interface includes a keyboard skip link, current-page semantics, visible
focus states, a text-first live result, reduced-motion handling, and layouts for
desktop, tablet, and narrow phone screens. The Home, Print, Docs, and About
pages use the same design system as the roller and only describe capabilities
that exist in the repository.

Run tests:

```bash
npm test
```

Build everything:

```bash
npm run build
```

## Dice Notation

Supported now:

- `d20`
- `1d20`
- `1d20 + 5`
- `2d6`
- `8d6`
- `d100`
- `d%`
- `2d20kh1`
- `2d20kl1`
- `4d6dl1`
- `4d6dh1`

Keep/drop expressions can include a modifier, for example `2d20kh1+5`.
Counts are limited to 1–100 dice and 2–1,000 sides. Keep/drop must leave at least one die.
Ties are resolved by original die order, so only the requested number are kept or dropped.

Planned later:

- exploding dice
- rerolls
- labels

## 3D Throws

The MVP uses result-first animation:

1. The dice engine generates the official result.
2. The Open Dice Motor adds seed, checksum, and throw-vector metadata.
3. The 3D scene animates presentation around that result.
4. The text result remains the source of truth.

This prevents visual dice from contradicting numeric results while the physics system is still early.

## Open Dice Motor

The motor lives in `packages/dice-engine/src/motor.ts`.

It returns motor rolls with:

- official result
- seed
- checksum
- per-die values
- per-die throw vectors for animation

The current web scene consumes motor vectors through `apps/web/src/dice3d/MotorDiceScene.tsx`.
It previews the first die using bevelled, surface-marked tetrahedron (d4), pip-marked cube (d6), octahedron (d8), pentagonal trapezohedron (d10), dodecahedron (d12), and icosahedron (d20) models.
The result settles upward. A d4 instead rests on its opposite face and repeats the result at the upper vertex, following the top-reading convention.
Percentile rolls use two d10s: a blue tens die marked 00–90 and an ivory units die marked 0–9. 00 + 0 means 100. These show the first percentile outcome, without the roll modifier.
Every individual outcome is shown below the preview, with dropped dice marked explicitly. Nonstandard side counts use a text preview instead of misleading geometry. Drag to inspect the model.
This remains deterministic, result-first animation, not a collision/physics simulation. Face mapping is tested for every supported value; full multi-die animation remains future work.
Each throw restarts the animation. Rendering stops when settled, respects reduced motion, and falls back to text if 3D fails. The 3D bundle loads on the first roll rather than on page load.

## Roll History

The app starts ready to roll without generating a visible result. The last 50 user rolls are stored in this browser under `open-dice.history.v1`; nothing is uploaded.
History preserves actual outcomes across refreshes. Reroll generates a new result from the saved formula.
Clear history supports Undo until the next roll or page reload. Storage failure keeps rolling functional and displays a session-only notice.
History is local to this browser, not shared across devices; simultaneous tabs are not synchronised.

## Printable Models

Initial OpenSCAD sources are in `packages/dice-models/openscad/`:

- `calibration-d6.scad`
- `basic-d6.scad`
- `basic-d20.scad`

STL and 3MF exports are not claimed as complete until generated and validated.

## License

Open Dice is by **Zein Alaouie**.

- **Code and docs:** MIT licence ([`LICENSE`](LICENSE)). Keep the copyright
  notice, which names Zein Alaouie, in any copy.
- **Dice models** (everything in [`packages/dice-models`](packages/dice-models)):
  Creative Commons Attribution 4.0 ([`packages/dice-models/LICENSE`](packages/dice-models/LICENSE)).
  You may remix the models and sell prints, as long as you credit the author:
  "Dice model by Zein Alaouie (Open Dice), CC BY 4.0", with a link to this
  repository, and say if you changed them.

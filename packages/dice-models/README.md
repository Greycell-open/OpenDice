# Open Dice models

Editable source files for every die the roller draws: d4, d6, d8, d10, d12 and
d20. They come from the same geometry as the 3D roller
(`apps/web/src/dice3d/diceModels.ts`), so what you print or edit matches what
you see on screen.

**By Zein Alaouie, licensed CC BY 4.0** (see [`LICENSE`](LICENSE)). Change
them, remix them, sell your prints, and credit the author wherever you share
the models or prints:

> Dice model by Zein Alaouie (Open Dice), CC BY 4.0
> https://github.com/Greycell-open/OpenDice

Units are millimetres. At the default size a d20 is about 20 mm across and a
d6 about 16 mm.

## What is here

| Folder | For | Notes |
|---|---|---|
| `openscad/generated/dN.scad` | Changing the dice | Parametric, numbers engraved. Open in [OpenSCAD](https://openscad.org), edit the values at the top, Render (F6), Export as STL. |
| `exports/stl/dN.stl` | Printing as is | Rendered from the `.scad` files with the numbers engraved 0.6 mm deep. |
| `exports/obj/dN.obj` | Blender and other 3D editors | The bevelled shape without numbers, for sculpting, texturing or your own markings. |
| `exports/faces/dN.json` | Building your own dice or app | Which number sits on which face: centre, outward normal and "up" direction of every label, in millimetres. |
| `openscad/*.scad` | Earlier hand-written sources | A basic d6, a basic d20 and a calibration d6. |

## Changing a die

The top of every `.scad` file has the settings:

```
size_scale     = 1.0;    // 1.25 is 25 percent larger
engrave_depth  = 0.6;    // mm into each face
font           = "Liberation Sans:style=Bold";
text_scale     = 1.0;    // grow or shrink every number
mark_six_nine  = true;   // a dot after 6 and 9 so they can be told apart
```

Any font installed on your computer works. To mark faces with symbols instead
of numbers, replace `label_text()` with your own function, for example one
that returns a different character per value.

## How the numbering works

- Opposite faces add up to sides + 1 (7 on a d6, 21 on a d20), like real dice.
- A d4 is read at its top point, so each face carries three corner numbers.
- The d10 is a pentagonal trapezohedron with flat kite faces, numbered 1 to 10.
  The roller shows a d100 as two d10s, tens and ones.

## Making them again

The files are generated, so edits to `diceModels.ts` flow through:

```
npm run models
```

This writes the `.scad`, `.obj` and `.json` files, then renders the engraved
STLs if OpenSCAD is installed (on PATH, or set `OPENSCAD` to its executable).

## Before you print a set

These models are checked as closed, single solids, but they have not been test
printed yet. Print one small die first and check the fit of the numbers before
a full set. Resin printers keep the engraving sharpest; on FDM printers, a
larger `size_scale` and a deeper `engrave_depth` help.

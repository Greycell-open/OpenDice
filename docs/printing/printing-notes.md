# Printing Notes

Initial printable sources are OpenSCAD files, not validated production models.

## Current Sources

- `calibration-d6.scad`: printer tuning and scale checks.
- `basic-d6.scad`: starter numbered d6.
- `basic-d20.scad`: starter icosahedral die geometry.

## Known Limitations

- STL and 3MF exports are not included until generated and checked.
- d20 number engraving is deferred until face orientation is validated.
- Balance and fairness are not yet validated.
- Engraving depth may need tuning per printer and material.

## FDM Notes

- Use fine layer height for readable details.
- Calibration d6 should be printed first.
- Sanding or painting can affect balance.

## Resin Notes

- Use adequate drainage/support strategy when models become hollowed.
- Wash and cure fully before use.
- Validate engraving depth on a small test before printing a full set.

## Export Commands

If OpenSCAD is installed, exports can be generated manually:

```bash
openscad -o packages/dice-models/exports/stl/calibration-d6.stl packages/dice-models/openscad/calibration-d6.scad
openscad -o packages/dice-models/exports/stl/basic-d6.stl packages/dice-models/openscad/basic-d6.scad
openscad -o packages/dice-models/exports/stl/basic-d20.stl packages/dice-models/openscad/basic-d20.scad
```

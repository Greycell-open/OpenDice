import { access } from "node:fs/promises";

const required = [
  "openscad/calibration-d6.scad",
  "openscad/basic-d6.scad",
  "openscad/basic-d20.scad",
];

await Promise.all(required.map((file) => access(new URL(`../${file}`, import.meta.url))));
console.log(`Checked ${required.length} OpenSCAD model sources.`);

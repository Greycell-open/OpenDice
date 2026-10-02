// Open Dice calibration d6
// MIT licensed. Source model for printer tuning and scale checks.

size = 20;
corner_radius = 2;
pip_radius = 1.15;
pip_depth = 0.7;

difference() {
  rounded_cube(size, corner_radius);
  pips();
}

module rounded_cube(s, r) {
  minkowski() {
    cube([s - 2 * r, s - 2 * r, s - 2 * r], center = true);
    sphere(r = r, $fn = 24);
  }
}

module pip_at(x, y, z, rx, ry, rz) {
  rotate([rx, ry, rz])
    translate([x, y, z])
      cylinder(h = pip_depth * 2, r = pip_radius, center = true, $fn = 24);
}

module face_pip_grid(z, positions) {
  for (pos = positions) {
    pip_at(pos[0], pos[1], z, 0, 0, 0);
  }
}

module pips() {
  offset = size * 0.23;
  face = size / 2;
  face_pip_grid(face, [[0, 0]]);
  rotate([180, 0, 0]) face_pip_grid(face, [[-offset, -offset], [offset, offset]]);
  rotate([0, 90, 0]) face_pip_grid(face, [[-offset, -offset], [0, 0], [offset, offset]]);
  rotate([0, -90, 0]) face_pip_grid(face, [[-offset, -offset], [-offset, offset], [offset, -offset], [offset, offset]]);
  rotate([90, 0, 0]) face_pip_grid(face, [[-offset, -offset], [-offset, offset], [0, 0], [offset, -offset], [offset, offset]]);
  rotate([-90, 0, 0]) face_pip_grid(face, [[-offset, -offset], [-offset, 0], [-offset, offset], [offset, -offset], [offset, 0], [offset, offset]]);
}

// Open Dice basic d6
// MIT licensed. Starter printable cube with engraved number placeholders.

size = 20;
corner_radius = 2.2;
engrave_depth = 0.65;

difference() {
  rounded_cube(size, corner_radius);
  number_faces();
}

module rounded_cube(s, r) {
  minkowski() {
    cube([s - 2 * r, s - 2 * r, s - 2 * r], center = true);
    sphere(r = r, $fn = 32);
  }
}

module engraved_number(n, z) {
  translate([0, 0, z])
    linear_extrude(height = engrave_depth * 2, center = true)
      text(str(n), size = 8, halign = "center", valign = "center", font = "Liberation Sans:style=Bold");
}

module number_faces() {
  face = size / 2;
  engraved_number(1, face);
  rotate([180, 0, 0]) engraved_number(6, face);
  rotate([0, 90, 0]) engraved_number(2, face);
  rotate([0, -90, 0]) engraved_number(5, face);
  rotate([90, 0, 0]) engraved_number(3, face);
  rotate([-90, 0, 0]) engraved_number(4, face);
}

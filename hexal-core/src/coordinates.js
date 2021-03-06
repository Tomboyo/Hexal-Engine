/**
 * Convert an axial coordinate into a linear point.
 *
 * The origin of the axial system is the linear point 0. All other axial
 * coordinates are guaranteed to be positive numbers.
 *
 * @param a An axial coordinate array, [x, y, z]
 * @return A nonnegative integer
 */
export const cubicToLinear = (a) => {
  var x = Math.abs(a[0]),
      y = Math.abs(a[1]),
      z = Math.abs(a[2]),
      ring = Math.max(x, y, z);

  var prev_count = (ring < 2 ? ring : 3 * (ring * ring - ring) + 1);

  if (a[1] === -ring) { return prev_count + z; }
  if (a[2] === ring)  { return prev_count + ring + x; }
  if (a[0] === -ring) { return prev_count + 2 * ring + y; }
  if (a[1] === ring)  { return prev_count + 3 * ring + z; }
  if (a[2] === -ring) { return prev_count + 4 * ring + x; }
  if (a[0] === ring)  { return prev_count + 5 * ring + y; }
};

/**
 * Convert pixel cartesian coordinates to cubic hexal coordinates.
 *
 * This does not factor in delta-x and delta-y offsets affecting the map
 * (gfx.dx and gfx.dy).
 *
 * @param config The HexalEngine map's configuration object. This is a crutch
 * for refactoring.
 * @param a The pixel coordinate pair [x, y]
 * @param d The depth of the pixel coordinate pair within the hexal map
 * @return The cubic coordinates of the pixel coordinate pair at the correct
 * depth
 */
export const pixelToCubic = (config, a, d) => {
  var vb, vbox, vboy, b, low, hx, hy, hz;

  d = (typeof d === "number" ? d : config.map.depth - 1);

  a[1] -= config.hex.skirt * (config.map.depth - 1 - d);

  // Upper relevent horizontal boundary between rows of hexagons
  vb = Math.floor((a[1]) / config.hex.dy);

  // vbox is x-origin of boundary.
  vbox = Math.abs(config.map.r - vb) * config.hex.dx / 2;

  // vboy is the peak's distance from x=0.
  vboy = vb * config.hex.dy;

  // height displacement at x from vb peak
  b = Math.abs(config.hex.dx / 4 - Math.ceil(Math.abs(a[0] - vbox) % config.hex.dx / 2));

  // calculate axial z if y-coordinate of boundary at x is greater
  if (a[1] < vboy + b) {
    vb -= 1;
    vbox = Math.abs(config.map.r - vb) * config.hex.dx / 2;
  }

  //l is lowest x for this hz
  low = -1 * Math.min(vb, config.map.r);

  hx = low + Math.floor((a[0] - vbox) / config.hex.dx);
  hz = vb - config.map.r;
  hy = 0 - hx - hz;

  return [hx, hy, hz];
};

/**
 * Convert cubic coordinates to pixel cartesian coordinates.
 *
 * This does not factor in delta-x and delta-y offsets affecting the map
 * (gfx.dx and gfx.dy).
 *
 * @param config The HexalEngine map's configuration object. This is a crutch
 * for refactoring.
 * @param a The cubic coordinate triple
 * @param d The depth of the cubic triple within the map. The default is
 * config.map.depth - 1.
 */
export const cubicToPixel = (config, a, d = config.map.depth - 1) => [
  (config.hex.dx) * (a[0] + config.map.r) + (config.hex.dx / 2) * a[2],
  (config.hex.dy) * (a[2] + config.map.r) +
    (config.hex.skirt * (config.map.depth - 1 - d))
];

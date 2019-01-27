/**
 * Convert an axial coordinate into a linear point.
 *
 * The origin of the axial system is the linear point 0. All other axial
 * coordinates are guaranteed to be positive numbers.
 *
 * @param a An axial coordinate array, [x, y, z]
 * @return A nonnegative integer
 */
export const cubicToLinear = cubicToIndex;
export const cubicToIndex = (a) => {
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

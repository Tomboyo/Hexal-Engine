/**
 * Finds the greatest common divisor of the given integers.
 * @param a An integer
 * @param b An integer
 * @return The greatest common divisor of a and b.
 */
export const gcd = (a, b) => {
  var quotient, remainder;

  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    console.error("Arguments must be integers");
    return;
  }

  a = Math.abs(a);
  b = Math.abs(b);

  if (a < b) {
    var tmp = a;
    a = b;
    b = tmp;
  }

  while (true) {
    quotient = Math.floor(a / b);
    remainder = a - quotient * b;
    if (remainder === 0) {
      return b;
    }

    a = b;
    b = remainder;
  }
};
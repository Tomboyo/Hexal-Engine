import { cubicToLinear } from 'src/coordinates';

export class Hexal {
  constructor(x, y, d, baseType, empty) {
    this.x = x;
    this.y = y;
    this.z = 0 - x - y;
    this.d = d;
    this.i = cubicToLinear([x, y, 0-x-y]);
    this.baseType = baseType || 'default';
    this.empty = empty || false;
  }
}

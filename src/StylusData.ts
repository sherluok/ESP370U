import { maxX, maxY, maxZ } from './specifications';

export class StylusData {
  constructor(protected view: DataView) {}

  get x() {
    return this.view.getUint16(1, true) / maxX;
  }

  get y() {
    return this.view.getUint16(3, true) / maxY;
  }

  get z() {
    return this.view.getUint16(5, true) / maxZ;
  }
}

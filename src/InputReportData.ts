import { StylusData } from './StylusData';

export class InputReportData extends DataView {
  constructor(view: DataView) {
    super(view.buffer, view.byteOffset, view.byteLength);
  }

  normalize() {
    return new StylusData(this);
  }

  matches(pattern: Iterable<number | null>) {
    return -1 === [...pattern].findIndex((n, i) => {
      return n !== null && n !== this.getUint8(i);
    });
  }

  print(label: string) {
    const style = 'background:rgb(0,112,245); color:#fff; padding:2px .5em 1px .5em; border-radius:4px;';
    const uint8s = new Uint8Array(this.buffer, this.byteOffset, this.byteLength);
    const hexStrs = [...uint8s].map((uint8) => uint8.toString(16).padStart(2, '0'));
    console.log('%c%s', style, hexStrs.join(' ').toUpperCase(), label);
  }
}

export interface EventMap {
  /** 抬起 */
  up: InputEvent;
  /** 按下 */
  down: InputEvent;
  /** 绘制 */
  move: InputEvent;
  /** 重签按钮被按下 */
  resign: InputEvent;
  /** 确认按钮被按下 */
  confirm: InputEvent;
  /** 连接已经建立 */
  initialize: InputEvent;
  /** 主动断开连接 */
  finalize: InputEvent;
  /** 主动重置成功 */
  reset: InputEvent;
  /** 设备握手成功 */
  handshake: InputEvent;
  /** 未知事件 */
  '?': InputEvent;
  /** 所有事件 */
  '*': InputEvent;
}

export const CommandMap = {
  init: [0x88, 0x70],
  open: [0x11, 0x70],
  close: [0x22, 0x70],
  resign: [0x33, 0x70],
};

export class ESP370U {
  static VENDOR_ID = 0x0b57;
  static PRODUCT_ID = 0x8420;
  static REPORT_ID = 5;
  static MIN_X = 0;
  static MIN_Y = 0;
  static MIN_VALID_X = 0;
  static MIN_VALID_Y = 0x0360;
  static MAX_VALID_X = 0x1800;
  static MAX_VALID_Y = 0x1bf0;
  static MAX_X = 0x1800;
  static MAX_Y = 0x2000;
  static MAX_Z = 0x0400;

  constructor(public device: HIDDevice) {
    const patterns = new Map<InputPattern, (input: InputEvent) => Promise<void>>([
      [[0xa0, null, null, null, null, null, null], (e) => this.emit('move', e)],
      [[0xa1, null, null, null, null, null, null], (e) => this.emit('move', e)],
      [[0xb0, null, null, null, null, null, null], (e) => this.emit('down', e)],
      [[0xe0, null, null, null, null, null, null], (e) => this.emit('up', e)],
      [[0x55, null, null, null, null, 0x00, 0x00], (e) => this.emit('resign', e)],
      [[0x55, null, null, null, null, 0x00, 0xff], (e) => this.emit('confirm', e)],
      [[0x55, 0x05, 0x11, 0x70, 0xff, 0xff, 0xff], (e) => this.emit('initialize', e)],
      [[0x55, 0x05, 0x22, 0x70, 0xff, 0xff, 0xff], (e) => this.emit('finalize', e)],
      [[0x55, 0x05, 0x33, 0x70, 0xff, 0xff, 0xff], (e) => this.emit('reset', e)],
      [[0x88, 0x00, 0x74, 0x00, 0x14, 0x65, 0x00], (e) => this.emit('handshake', e)],
      [[null, null, null, null, null, null, null], (e) => this.emit('?', e)],
    ]);

    this.device.addEventListener('inputreport', async (e) => {
      if (e.reportId !== 2) return console.dir(e);
      const input = new InputEvent(e.data);
      await this.emit('*', input);
      if (!input.stopped) {
        for (const [pattern, dispatch] of patterns.entries()) {
          if (input.matches(pattern)) {
            await dispatch(input);
            break;
          }
        }
      }
    });
  }

  protected listenersMap = new Map<keyof EventMap, Set<(e: any) => void>>();

  protected listernersOf(type: keyof EventMap) {
    if (!this.listenersMap.has(type)) this.listenersMap.set(type, new Set());
    return this.listenersMap.get(type)!;
  }

  protected async emit<K extends keyof EventMap>(type: K, data: EventMap[K]) {
    for (const listener of this.listernersOf(type)) {
      await listener(data);
    }
  }

  on<K extends keyof EventMap>(type: K, listener: (e: EventMap[K]) => void) {
    this.listernersOf(type).add(listener);
    return () => this.off(type, listener);
  }

  off<K extends keyof EventMap>(type: K, listener: (e: EventMap[K]) => void) {
    this.listernersOf(type).delete(listener);
  }

  once<K extends keyof EventMap>(type: K, timeout?: number) {
    return new Promise<EventMap[K]>((resolve, reject) => {
      const removeListener = this.on(type, (e) => {
        window.clearTimeout(timeoutId);
        removeListener();
        resolve(e);
      });

      const timeoutId = !Number.isFinite(timeout) ? -1 : window.setTimeout(() => {
        removeListener();
        reject(new TimeoutError(type, timeout!));
      }, timeout);
    });
  }

  send(data: keyof typeof CommandMap): Promise<void>;
  send(data: Iterable<number>): Promise<void>;
  async send(data: keyof typeof CommandMap | Iterable<number>) {
    if (typeof data === 'string') {
      await this.send(CommandMap[data]);
    } else {
      await this.device.sendFeatureReport(ESP370U.REPORT_ID, Uint8Array.from(data));
    }
  }
}

type N = null | number;
export type InputPattern = [N, N, N, N, N, N, N];

export class InputEvent extends DataView {
  constructor(view: DataView) {
    super(view.buffer, view.byteOffset, view.byteLength);
  }

  normalize() {
    return new StylusData(this);
  }

  matches(pattern: InputPattern) {
    return -1 === pattern.findIndex((n, i) => {
      return n !== null && n !== this.getUint8(i);
    });
  }

  print(label: string) {
    const uint8s = new Uint8Array(this.buffer, this.byteOffset, this.byteLength);
    const hexStr = [...uint8s].map((uint8) => uint8.toString(16).padStart(2, '0'));
    console.log('[%s]', label, ...hexStr);
  }

  stopped?: boolean;

  stop() {
    this.stopped = true;
  }
}

export class StylusData {
  constructor(protected view: DataView) {}

  get x() {
    return this.view.getUint16(1, true) / ESP370U.MAX_X;
  }

  get y() {
    return this.view.getUint16(3, true) / ESP370U.MAX_Y;
  }

  get z() {
    return this.view.getUint16(5, true) / ESP370U.MAX_Z;
  }
}

export class TimeoutError<T> extends Error {
  constructor(
    public type: T,
    public timeout: number,
  ) {
    super(`??`);
  }
}

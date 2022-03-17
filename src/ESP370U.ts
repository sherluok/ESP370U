import { EventEmitter } from './EventEmitter';
import { makesureDevice } from './utils';
import { InputReportData } from './InputReportData';
import { commands, events, productId, reportId, vendorId } from './specifications';

type EventType = '*' | keyof typeof events | '?';
type EventMap = Record<EventType, InputReportData>;

export class ESP370U extends EventEmitter<EventMap> {
  static async makesure(suspense: (onUserGesture: (teardownLogic: any) => void) => void) {
    let device = await makesureDevice({ vendorId, productId }, suspense);
    return new ESP370U(device);
  }

  constructor(public device: HIDDevice) {
    super();
    console.log(device);
    this.device.addEventListener('inputreport', this.onInputReport);
  }

  async destroy() {
    this.device.removeEventListener('inputreport', this.onInputReport);
    if (this.device.opened) {
      await this.send('close');
      await this.device.close();
    }
  }

  private onInputReport = async (e: HIDInputReportEvent) => {
    if (e.reportId !== 2) return console.dir(e);
    const input = new InputReportData(e.data);
    const abort = await this.emit('*', input);
    if (!abort) {
      for (const [type, patterns] of Object.entries(events)) {
        for (const pattern of patterns) {
          if (input.matches(pattern)) {
            await this.emit(type as EventType, input);
            return;
          }
        }
      }
      await this.emit('?', input);
    }
  }

  async open() {
    if (!this.device.opened) {
      await this.device.open();
    }
    this.send('init');
  }

  async send(command: keyof typeof commands | Iterable<number>) {
    if (typeof command === 'string') {
      await this.send(commands[command]);
    } else {
      await this.device.sendFeatureReport(reportId, Uint8Array.from(command));
    }
  }
}

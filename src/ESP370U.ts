import { EventEmitter } from './EventEmitter';
import { InputReportData } from './InputReportData';
import { commands, events, reportId } from './specifications';

type EventType = '*' | keyof typeof events | '?';
type EventMap = Record<EventType, InputReportData>;

export class ESP370U extends EventEmitter<EventMap> {
  constructor(public device: HIDDevice) {
    super();

    this.device.addEventListener('inputreport', async (e) => {
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
    });
  }

  async send(command: keyof typeof commands | Iterable<number>) {
    if (typeof command === 'string') {
      await this.send(commands[command]);
    } else {
      await this.device.sendFeatureReport(reportId, Uint8Array.from(command));
    }
  }
}

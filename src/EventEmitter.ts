import { TimeoutError } from './TimeoutError';

function isFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export class EventEmitter<EventMap> {
  protected listenersMap = new Map<keyof EventMap, Set<(e: any) => any>>();

  protected listernersOf(type: keyof EventMap) {
    if (!this.listenersMap.has(type)) this.listenersMap.set(type, new Set());
    return this.listenersMap.get(type)!;
  }

  async emit<K extends keyof EventMap>(type: K, data: EventMap[K]) {
    for (const listener of this.listernersOf(type)) {
      if (await listener(data) === true) {
        return true;
      }
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
        clearTimeout(timeoutId);
        removeListener();
        resolve(e);
      });

      const timeoutId = isFinite(timeout) ? setTimeout(() => {
        removeListener();
        reject(new TimeoutError(type, timeout));
      }, timeout) : -1;
    });
  }
}

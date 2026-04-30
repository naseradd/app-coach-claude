import { EventEmitter } from 'node:events';
import type { SseEvent } from '@coach/shared';

class TypedBus extends EventEmitter {
  publish(ev: SseEvent): void {
    this.emit('event', ev);
  }
  subscribe(cb: (ev: SseEvent) => void): () => void {
    this.on('event', cb);
    return () => {
      this.off('event', cb);
    };
  }
}

export const eventBus = new TypedBus();
eventBus.setMaxListeners(50);

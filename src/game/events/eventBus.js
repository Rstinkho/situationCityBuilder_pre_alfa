class Bus {
  constructor() {
    this.listeners = new Map();
  }
  on(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    const set = this.listeners.get(type);
    set.add(fn);
    return () => set.delete(fn);
  }
  emit(type, payload) {
    const set = this.listeners.get(type);
    if (!set) return;
    set.forEach((fn) => fn(payload));
  }
}

const EventBus = new Bus();
export default EventBus;

const TimeSystem = {
  timers: [],

  every(scene, ms, cb) {
    const t = scene.time.addEvent({ delay: ms, loop: true, callback: cb });
    this.timers.push(t);
    return t;
  },

  clearAll() {
    this.timers.forEach((t) => t.remove(false));
    this.timers.length = 0;
  },
};

export default TimeSystem;
